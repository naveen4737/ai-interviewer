import interviewContext from "./interviewContext";
import React from 'react'
import { useState } from "react";
import { SocketContext } from "../Socket/socket";

const InterviewState = (props) => {

  const socket = React.useContext(SocketContext);
  const [username, setUsername] = useState("")
  const [usernameAlert, setUsernameAlert] = useState(null);
  const [inRoom, setInRoom] = useState(false);
  // const [inRoom, setInRoom] = useState(true);

  const createRoom = () => {
    socket.connect();
    setUsernameAlert(null);
    if (username == null || username == "") {
      setUsernameAlert("user name connot be empty")
      return;
    }
    if (username.length < 3) {
      setUsernameAlert("Length of username connot be less than 3")
      return;
    }
    if (username.length > 20) {
      setUsernameAlert("Length of username connot be more than 20")
      return;
    }
    console.log("connecting to server to create room")
    socket.emit(`create_room`, username)
  }

  return (
    // <NoteContext.Provider value={{ notes, addNote, deleteNote, editNote, getNotes }}>
    <interviewContext.Provider value={{ username, setUsername, usernameAlert, setUsernameAlert, createRoom, inRoom, setInRoom }}>
      {props.children}
    </interviewContext.Provider>
  )
}

export default InterviewState;