const express = require("express");
const http = require("http");
const cors = require("cors");
// const sio = require("socket.io");
const compression = require("compression");

const app = express(),
  port = process.env.PORT || 5000,
  server = http.createServer(app).listen(port);
app.use(cors());

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

// Switch off the default 'X-Powered-By: Express' header
app.disable("x-powered-by");
io.sockets.on("connection", (socket) => {
  console.log("connected");
  let room = "";
  // sending to all clients in the room (channel) except sender
  socket.on("message", (message) => {
    console.log("message type", message.type);
    socket.broadcast.emit("message", message);
  });
  socket.on("find", () => {
    const url = socket.request.headers.referer.split("/");
    room = url[url.length - 1];
    const sr = io.sockets.adapter.rooms[room];
    if (sr === undefined) {
      // no room with such name is found so create it
      socket.join(room);
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
    socket.broadcast.to(room).emit("hangup");
    socket.leave(room);
  });
});