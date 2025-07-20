// const express = require("express");
// const http = require("http");
// const socketIO = require("socket.io");

// const app = express();
// const server = http.createServer(app);
// const io = socketIO(server);

// const PORT = 3000;

// app.use(express.static("public"));

// io.on("connection", (socket) => {
//   console.log("New client connected:", socket.id);

//   // Join room
//   socket.on("join", (roomId) => {
//     socket.join(roomId);
//     socket.to(roomId).emit("new-user", socket.id);
//   });

//   // Relay signaling messages
//   socket.on("signal", (data) => {
//     io.to(data.to).emit("signal", {
//       from: socket.id,
//       signal: data.signal,
//     });
//   });

//   // Handle disconnect
//   socket.on("disconnect", () => {
//     io.emit("user-disconnected", socket.id);
//   });
// });

// server.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("New client:", socket.id);

  // Join a room
  socket.on("join", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
    // Notify existing users
    socket.to(room).emit("user-joined", socket.id);
  });

  // Relay offer/answer/candidate
  socket.on("signal", ({ to, data }) => {
    io.to(to).emit("signal", { from: socket.id, data });
  });

  socket.on("disconnecting", () => {
    const rooms = Object.keys(socket.rooms);
    rooms.forEach((room) => {
      socket.to(room).emit("user-left", socket.id);
    });
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
