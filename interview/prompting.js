const { ask } = require("../utils/openai");
const { convert_pdf_to_text } = require("../utils/utils");


const generate_initial_question = async (pdf_text) => {
  let questions = [];
  let summary = "";

  let one_time_char_limit = 3000;
  let questions_to_generate = 10;
  let char_len = pdf_text.length;
  let loop_to_iterate = Math.floor(char_len/one_time_char_limit);
  let question_at_once = Math.max(Math.floor(questions_to_generate/loop_to_iterate), 1);

  console.log("calling the openai to generate question")

  for(let iterator=0; iterator<loop_to_iterate; iterator++) {
    let start_index = iterator*one_time_char_limit;
    let end_index = Math.min((iterator+1)*one_time_char_limit, char_len);

    let text = pdf_text.substring(start_index, end_index);
    
    let messages = [
      {"role": "system", "content": "Take the role of an Oral Examiner."},
      {"role": "system", "content": "Firstly, I am going to give you the text and summary of the previous text (that was before the current text that I am providing now). You have to combine both of them and generate the new summary of not more than 200 words."},
      {"role": "system", "content": "Also, using the current text and the summary of previous text. You have to generate "+question_at_once+" question/s. (And, write the questions in the given JSON array string format in such a way that the string will be directly asked to the candidate [don't do any numbering on the questions])"},
      {"role": "system", "content": "Both, the summary and questions should be returned in the specific JSON format, like I am telling in this example enclosed in triple backticks (also don't use double quotes anywhere inside the values in the JSON response format, since it will give error while parsing response through JSON parser, instead use single quotes or back ticks or any other thing, wherever double quotes are required): \n\n ```{\n{\"Summary\": \"The whole summary has to be written here\"}, {\"Questions\": [\"What is JavaScript\", \"How closures work in JavaScript\", \"Can you tell me about the event loop in JavaScript\"]}\n}``` "},
      {"role": "system", "content": "This is the summary of the previous text: "+summary},
      {"role": "system", "content": "This is the current text: "+text},
      {"role": "system", "content": "Generate the summary and question from it as told in the above format"}
    ]
    let response = await ask(messages);
    response = JSON.parse(response)
    summary = response.Summary;
    questions.push(...response.Questions);
  }
  return {summary, questions}
}

const get_feedback_correctness_followup = async (transcript, summary, question, user_answer) => {
  let messages = [
    {"role": "system", "content": "Take the role of an Oral Examiner, You are asking questions from the candidate from the given text."+summary},
    {"role": "system", "content": "This is the previous transcript for the conversation between you (as a Oral examiner, and the candidate: \n\n"+transcript},
    {"role": "system", "content": "This was the question that was asked by you (as Oral Examiner) to the candidate: "+question},
    {"role": "system", "content": "You have to tell the following details: \n answer_correctness: 'respond \"YES\" or \"NO\" to this'. \n answer_feedback: 'give feedback to the candidate keeping in mind that you are the Oral Examiner and w.r.t. the answer_correctness'. \n followup_question: 'respond \"NO\" if good followup question could not be asked give the question to be asked directly to the candidate '"},
    {"role": "system", "content": "You have to give the following details in the JSON format as given in example below enclosed in triple backticks (also don't use double quotes anywhere inside the values in JSON response, since it will give error while parsing response through JSON parser, instead use single quotes or back ticks or any other thing if required):\n\n ```{\"answer_correctness\": \"YES\", \"answer_feedback\": \"It is good to know how closures work in JavaScript, and how it could be utilized to achieve so much things.\", \"followup_question\": \"Now, can you give me an example of closures in work in the execution stack.\"}```"},
    {"role": "system", "content": "Now, the candidate will tell you the answer, you have to give all the above 3 things in the JSON format as told in above example"},
    {"role": "user", "content": user_answer},
  ]
  let response = await ask(messages);
  console.log(response);
  return response;
}

// module.exports = { generate_initial_question, generate_summary_of_text, generate_answers_feedback, get_answer_correctness, generate_followup_question, get_feedback_correctness_folloup };
module.exports = { generate_initial_question, get_feedback_correctness_followup };