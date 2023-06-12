const express = require("express");
// const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");

const { addUser, removeUser, getUser, getUserInRoom } = require("./users");

const router = require("./router");

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);

var io = require("socket.io")(server, {
  cors: {
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

// const io = new Server(server);

app.use(cors({ origin: "*" }));
app.use(router);

// const ioo = io(server);

io.on("connection", (socket) => {
  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);

    socket.emit("message", {
      user: "admin",
      text: `${user.name} welcome to the room ${user.room}`,
    });
    socket.broadcast.to(user.room).emit("message", {
      user: "admin",
      text: `${user.name}, has joined the room`,
    });

    socket.join(user.room);

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUserInRoom(user.room),
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const userMessage = getUser(socket.id);
    // const room = userMessage.room;
    // console.log(userMessage);

    // if (room) {
    io.to(userMessage.room).emit("message", {
      userMessage: userMessage.name,
      text: message,
    });
    io.to(userMessage.room).emit("roomData", {
      room: userMessage.room,
      users: getUserInRoom(userMessage.room),
    });
    callback();
    // }
  });

  socket.on("disconnet", () => {
    const userMessage = removeUser(socket.id);

    if (userMessage) {
      io.to(userMessage.room).emit("message", {
        user: "admin",
        text: `${userMessage.name} has left the room`,
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`server listining on port .. ${PORT}`);
});
