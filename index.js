const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
// const favicon = require("serve-favicon");
// const sio = require("socket.io");
const compression = require("compression");

const app = express();
app.use(cors());
const port = process.env.PORT || 5000;
const server = http.createServer(app).listen(port);

const io = require("socket.io")(server, {
  cors: { origin: "*" },
  handlePreflightRequest: (req, res) => {
    const headers = {
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Origin": req.headers.origin, //or the specific origin you want to give access to,
      "Access-Control-Allow-Credentials": true,
    };
    res.writeHead(200, headers);
    res.end();
  },
});

// compress all requests

app.use(compression());
app.use(express.static(path.join(__dirname, "/client/build")));
app.use((req, res) => res.sendFile(__dirname + "/client/build/index.html"));
// app.use(favicon("../client/build/favicon.ico"));

// Switch off the default 'X-Powered-By: Express' header
app.disable("x-powered-by");
io.sockets.on("connection", (socket) => {
  console.log("connected");
  let room = "";
  // sending to all clients in the room (channel) except sender
  socket.on("join", (roomID) => {
    console.log(`Socket ${socket.id} joining ${roomID}`);
    room = roomID;
    socket.join(roomID);

    socket.to(roomID).emit("init", room);
  });

  socket.on("text", (text) => {
 text.from = "external";
    socket.to(room).emit("text", text);
  });
  socket.on("message", (message) => {
    // console.log("message type", message.type, message);
    socket.to(room).emit("message", message);;
  });
  socket.on("find", (room) => {
    room = room;
    const sr = io.sockets.adapter.rooms[room];
    if (sr === undefined) {
      // no room with such name is found so create it
      socket.join(room);
      console.log("Room created");
      socket.emit("create");
    } else if (sr.length === 1) {
      socket.emit("join");
    } else {
      // max two clients
      socket.emit("full", room);
    }
  });
  socket.on("auth", (data) => {
    data.sid = socket.id;
    // sending to all clients in the room (channel) except sender
    socket.broadcast.to(room).emit("approve", data);
  });
  socket.on("accept", (id) => {
    io.sockets.connected[id].join(room);
    // sending to all clients in 'game' room(channel), include sender
    io.in(room).emit("bridge");
  });
  socket.on("reject", () => socket.emit("full"));
  socket.on("leave", () => {
    // sending to all clients in the room (channel) except sender
    console.log("leaved");
    socket.broadcast.to(room).emit("hangup");
    socket.leave(room);
  });
});
