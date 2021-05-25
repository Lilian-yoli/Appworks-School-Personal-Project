const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const http = require("http");
const server = http.createServer(app);
const socketio = require("socket.io");
const io = socketio(server);
// eslint-disable-next-line no-unused-vars
const API_VERSION = process.env;
const pathRoutes = require("./server/routes/path_routes");
const userRoutes = require("./server/routes/user_routes");
const passengerRoutes = require("./server/routes/passenger_route");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extend: true }));
app.use(express.static("public"));
app.use(pathRoutes);
app.use(userRoutes);
app.use(passengerRoutes);

// app.use("/api/" + API_VERSION, [pathRoutes]);
const users = {};
let usersNum = 0;
io.on("connection", socket => {
  console.log("user connection", socket.id);

  usersNum++;
  console.log(`There are ${usersNum} users connected...`);
  socket.on("login", (data) => {
    users[data.username] = socket.id;
    console.log(users);
    socket.emit("loginSuccess", users);
  });
  socket.on("joinRoom", data => {
    const senderJoin = userJoin(socket.id, data.sender, data.room);
    const receiverJoin = userJoin(users[data.receiver], data.receiver, data.room);

    socket.join(data.room);
  });
  socket.on("sendMsg", (data) => {
    socket.to(users[data.receiver]).emit("receiveMsg", data.msg);
  });

  socket.on("disconnect", () => {
    usersNum--;
    console.log(`There are ${usersNum} users connected...`);
  });
  // socket.emit("message", "Welcome to chatbox");

  // // broadcast when a user connects
  // socket.broadcast.emit("message", "A user has joinde the chat");

// // Runs when client disconnects
// socket.on("disconnect", () => {
//   io.emit("message", "A user has left the chat");
// });
// socket.on("chatMessage", msg => {
//   io.emit("message", msg);
//   console.log(msg);
// });
});

server.listen(3000, () => {
  console.log("Server Started...");
});
