import React, {useState, useEffect} from 'react'
import { useReactMediaRecorder } from "react-media-recorder";
import { SocketContext } from "../context/Socket/socket";
import CountdownTimer from './CountdownTimer';

const Interview = () => {

  const socket = React.useContext(SocketContext);

  const [audioBlob, setAudioBlob] = useState(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [interviewState, setInterviewState] = useState(null)
  const speakingTime = 20; // in seconds
  const [seconds, setSeconds] = useState(speakingTime);

  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ audio: true });

  const sendAudio = async () => {
    setAudioBlob(mediaBlobUrl);
    const mediaBlob = await fetch(mediaBlobUrl).then(response => response.blob());
    socket.emit("audio-transfer", mediaBlob, (status) => {
      console.log(status);
    });
  }

  const handleAudioFromServer = (file, callback) => {
    setInterviewState("ongoing");
    setAudioBlob(file);

    const blob = new Blob([file], { type: 'audio/wav' });
    const blobUrl = URL.createObjectURL(blob);
    setAudioBlobUrl(blobUrl);
  }

  const handleServerError = (error) => {
    setServerError(error);
    setInterviewState("error")
  }

  const handleAudioEnd = () => {
    startRecording();
  };

  const startInterview = () => {
    socket.emit(`start_interview`);
  }

  const interviewReady = () => {
    setInterviewState("ready");
  }

  const interviewEnded = () => {
    setInterviewState("ended");
  }
  
  useEffect(() => {
    socket.on("interviewer-audio", handleAudioFromServer);
    socket.on("interview_ready", interviewReady);
    socket.on("end_interview", interviewEnded);
    socket.on("error_occured", handleServerError);
    
    return () => {
      socket.off("interviewer-audio", handleAudioFromServer);
      socket.on("interview_ready", interviewReady);
      socket.on("end_interview", interviewEnded);
      socket.off("error_occured", handleServerError);
    };
  }, [audioBlob, interviewState])

  useEffect(() => {
    setInterviewState("initializing");
  }, [])

  useEffect(() => {
    if(status == 'recording'){
      setTimeout(()=>{
        stopRecording();
      }, speakingTime * 1000);
    }
    if(status == 'stopped'){
      sendAudio();
    }
    if (status=='recording') {
      setSeconds(speakingTime);
    }
  }, [status]);

  useEffect(() => {
    if (seconds > 0 && status=='recording') {
      const timerId = setInterval(() => {
        setSeconds(prevSeconds => prevSeconds - 1);
      }, 1000);

      return () => {
        clearInterval(timerId);
      };
    }
  }, [seconds, status]);


  return (
    <div className="mt-5 container">

      {interviewState=='initializing' && 
      <>
        <p>Initialing Interview</p>
      </>
      }

      {interviewState=='ready' && 
      <>
        <button onClick={startInterview}>Start Interview</button>
      </>
      }

      {interviewState=='ongoing' && 
      <>
        <CountdownTimer/>
        {status=='recording' && 
          <>
            <h5>Speak...</h5>
            <p>Time remaining: {seconds}</p>
          </>
        }
      </>
      }

      {interviewState=='ended' && 
      <>
        <h3>Interview Ended Successfully</h3>
      </>
      }

      {audioBlobUrl && (
        <audio controls src={audioBlobUrl} onEnded={handleAudioEnd} autoPlay style={{ display: 'none' }}/>
      )}

      {serverError && <>
        <p style={{color: "red"}}>{serverError}</p>
      </>}
    </div>
  );
};

export default Interview