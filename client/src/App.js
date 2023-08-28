import './App.css';
import Home from './components/Home';
import {SocketContext, socket } from "./context/Socket/socket";
import InterviewState from './context/Interview/InterviewState';

function App() {
  return (
    <SocketContext.Provider value={socket}>
      <InterviewState>
        <div className="App">
          <Home/>
        </div>
      </InterviewState>
    </SocketContext.Provider>
  );
}

export default App;
