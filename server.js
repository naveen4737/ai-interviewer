const express = require('express');
const app = express();
const dotenv = require("dotenv");
const http = require('http');
const path = require("path");
const connectDb = require("./config/connectDb");
dotenv.config({path: ".env"});
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});
const port = process.env.PORT || 9000;

//databse call
connectDb();

io.on('connection', (socket) => {
  console.log('a user connected, '+socket.id);
  require('./interview/interview.js')(socket, io);
  return io;
});

if(process.env.NODE_ENV === "production"){
  app.use(express.static(path.join(__dirname, 'client/build')));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"))
  })
}
else{
  console.log(process.env.NODE_ENV)
  app.get("/", (req, res) => {
    res.send("api running");
  })
}

server.listen(port, () => {
  console.log(`listening on http://localhost:${port}`);
});

