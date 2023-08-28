import React, { useContext, useState, useEffect } from 'react'
import interviewContext from '../context/Interview/interviewContext';
import Interview from './Interview';
import { SocketContext } from "../context/Socket/socket.js";

const Form = () => {

  const socket = useContext(SocketContext);

  const cccontext = useContext(interviewContext);
  const { username, setUsername, usernameAlert, setUsernameAlert, createRoom, inRoom, setInRoom } = cccontext;

  const proceedInterview = () => {
    createRoom();
    console.log("start interview");
  }

  const onNameChange = (e) => {
    setUsername(e.target.value)
  }

  const handleInit = (data) => {
    console.log("printing data of init", data)
    setInRoom(true);
  }

  useEffect(() => {
    // all the listeners
    socket.on('initialize_interview', handleInit);

    return () => {
      // before the component is destroyed unbind all event handlers used in this component
      socket.off('initialize_interview', handleInit);
    };
  }, [])


  return (
    <div className="room_box container">


      {!inRoom && (<>
        <form className="mt-4">
          <input type="text" className="form-control p-3" id="title" name="roomName" value={username} onChange={onNameChange} required placeholder='Enter your Name' />
          {usernameAlert !== null && (
            <div className="error">{usernameAlert}</div>
          )}
        </form>
        <hr />
        <button className="btn btn-success px-4 py-3 mb-4" onClick={proceedInterview}>Proceed</button>
      </>)}

      {inRoom && <Interview />}

    </div>
  )
}

export default Form
