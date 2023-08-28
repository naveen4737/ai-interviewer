const { makeid, convert_pdf_to_text } = require('../utils/utils')
const ss = require('socket.io-stream')
const fs = require('fs')
const { audio_to_text } = require('../utils/openai')
const {
  generate_initial_question,
  get_feedback_correctness_followup
} = require('./prompting')
const { textToSpeech } = require('../utils/speech')
const transcriptModel = require('../models/transcriptModel')

// These are global vaiables
const state = {} // it's uniqueness is defined by "roomName"
// schema of state
// {
//   "id": {
//     "Questions": [],
//     "last_asked_question_number": 1,
//     "current_follow_up_count": 2, //don't ask follow up, more than 2 times
//     "current_question_transcript": "...."
//     "transcript": "....",
//     "summary": "....",
//     "last_question_asked": "...."
//   }
// }

// to map, user's socket id, with the roomName
const interviewRooms = {}
const min_minutes = 3; // in minutes

module.exports = (socket, io) => {

  const create_new_room = async (username) => {
    try {
      console.log('creating room for: ', socket.id)
      let roomName = makeid(5);
      interviewRooms[socket.id] = roomName // storing the interview roomName in "interviewRooms" global variable.

      state[roomName] = {
        username: username,
        transcript: 'EMPTY',
        summary: '',
        start_time: new Date()
      }

      socket.join(roomName);
      socket.emit('initialize_interview', username);

      // read pdf here, and get its text here
      let pdf_text = convert_pdf_to_text()

      // generate question from this pdf text
      let { summary, questions } = await generate_initial_question(pdf_text)

      state[roomName] = {
        username: username,
        Questions: questions,
        last_asked_question_number: -1,
        current_follow_up_count: 0, //don't ask follow up, more than 2 times
        current_question_transcript: '',
        transcript: '',
        summary: summary,
        last_question_asked: '',
        start_time: new Date()
      }

      socket.emit('interview_ready', username)
    } catch (error) {
      console.log(error)
      socket.emit('error_occured', 'Please try again after sometime')
      disconnected();
    }
  }

  const start_interview = async () => {
    try {
      let roomName = interviewRooms[socket.id];
      state[roomName].start_time = new Date();
      ask_next_question()
    } catch (error) {
      console.log(error)
      socket.emit('error_occured', 'Please try again after sometime')
      disconnected();
    }
  }

  const ask_next_question = async () => {
    try {
      let roomName = interviewRooms[socket.id]
      let last_asked_question_number =
        state[roomName].last_asked_question_number
      let current_follow_up_count = state[roomName].current_follow_up_count

      if(state[roomName].Question==last_asked_question_number+1){
        socket.emit("end_interview", "Interview had ended");
        disconnected();
        return;
      }

      let question_to_ask =
        state[roomName].Questions[last_asked_question_number + 1]
      state[roomName].current_follow_up_count = 0
      state[roomName].last_question_asked = question_to_ask
      if (last_asked_question_number != -1) {
        question_to_ask = 'Okay, Now ' + question_to_ask
      }
      await textToSpeech(question_to_ask, socket.id + '.mp3')
      await sendAudioToCandidate()
      state[roomName].last_asked_question_number++
      state[roomName].current_question_transcript = '{"Examiner": ' + question_to_ask + '},'
      state[roomName].transcript += '{"Examiner": ' + question_to_ask + '},'
      return
    } catch (error) {
      console.log(error)
      socket.emit('error_occured', 'Please try again after sometime')
      disconnected();
    }
  }

  const sendAudioToCandidate = () => {
    try {
      const file = fs.readFileSync('./local/' + socket.id + '.mp3')
      socket.emit('interviewer-audio', file, status => {
        console.log(status)
      })
    } catch (error) {
      console.log(error)
      socket.emit('error_occured', 'Please try again after sometime')
      disconnected();
    }
  }

  const disconnected = async () => {
    console.log('interview ended for candidate: ', socket.id)
    // Here, save the transcript in the DB
    
    try{
      let roomName = interviewRooms[socket.id];
      const newTranscript = new transcriptModel({
        userid: socket.id,
        username: state[roomName].username,
        transcript: state[roomName].transcript
      });
      const result = await newTranscript.save();
    } catch (err) {
      console.log("Transcript could't be saved");
      console.log(err)
    }
    try {
      fs.unlinkSync('./local/' + socket.id + '.mp3')
      console.log('Successfully deleted the file.')
    } catch (err) {
      console.log("File couldn't be deleted")
      console.log(err)
    }
  }

  const handleAudioFromClient = async file => {
    try {
      console.log(file) // <Buffer 25 50 44 ...>

      fs.writeFileSync('./local/' + socket.id + '.mp3', file, 'binary', err => {
        callback({ message: err ? 'failure' : 'success' })
      })

      let candidate_response = await audio_to_text(socket.id + '.mp3')

      let roomName = interviewRooms[socket.id]

      let current_time = new Date();
      if((current_time - state[roomName].start_time) > (min_minutes*60*1000)){
        // time excedded, now end the interview
        state[roomName].current_question_transcript +=
          '{"Candidate": ' + candidate_response + '},';
        state[roomName].transcript +=
          '{"Candidate": ' + candidate_response + '},';
        socket.emit("end_interview", "Interview had ended");
        disconnected();
        return;
      }

      let resp = await get_feedback_correctness_followup(
        state[roomName].transcript,
        state[roomName].summary,
        state[roomName].last_question_asked,
        candidate_response
      )

      resp = JSON.parse(resp)
      let answer_correctness = resp.answer_correctness.trim().toLowerCase()
      let answer_feedback = resp.answer_feedback
      let followup_question = resp.followup_question

      if (
        answer_correctness == 'no' ||
        followup_question.toLowerCase() == 'no' ||
        state[roomName].current_follow_up_count == 2
      ) {
        // no follow up possible
        // now, ask the next question
        state[roomName].current_question_transcript +=
          '{"Candidate": ' + candidate_response + '},';
        state[roomName].transcript +=
          '{"Candidate": ' + candidate_response + '},';
        await ask_next_question()
      } else {
        // follow up is possible
        let response = answer_feedback + '\n' + followup_question
        state[roomName].last_question_asked = response
        state[roomName].current_follow_up_count += 1

        state[roomName].current_question_transcript += '{"Candidate": ' + candidate_response + '},'
        state[roomName].transcript += '{"Candidate": ' + candidate_response + '},'

        // also add current followup question to the list
        state[roomName].current_question_transcript += '{"Interviewer": ' + response + '},'
        state[roomName].transcript += '{"Interviewer": ' + response + '},'
        state[roomName].last_question_asked = followup_question

        await textToSpeech(response, socket.id + '.mp3')
        await sendAudioToCandidate()
      }
    } catch (error) {
      console.log(error)
      console.log("asking next question because of error")
      await ask_next_question();
      // socket.emit('error_occured', 'Please try again after sometime')
    }
  }

  socket.on('disconnect', disconnected)
  socket.on(`create_room`, create_new_room)
  socket.on(`start_interview`, start_interview)
  socket.on('audio-transfer', handleAudioFromClient)
}
