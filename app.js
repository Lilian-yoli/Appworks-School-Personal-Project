const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const server = require("http").createServer(app);
const io = require("socket.io")(server);
// eslint-disable-next-line no-unused-vars
const API_VERSION = process.env;
const pathRoutes = require("./server/routes/path_routes");
const userRoutes = require("./server/routes/user_routes");
const passengerRoutes = require("./server/routes/passenger_route");
const chatRoutes = require("./server/routes/chat_route");
const Chat = require("./server/models/chat_model.js");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extend: true }));
app.use(express.static("public"));
app.use(pathRoutes);
app.use(userRoutes);
app.use(passengerRoutes);
app.use(chatRoutes);

// app.use("/api/" + API_VERSION, [pathRoutes]);
const users = {};
const rusers = {};
let usersNum = 0;
io.on("connection", socket => {
  console.log("user connection", socket.id);

  usersNum++;
  console.log(`There are ${usersNum} users connected...`);
  socket.on("login", (data) => {
    users[data] = socket.id;
    rusers[socket.id] = data;
    console.log("users", users, rusers);
    socket.emit("loginSuccess", users);
  });

  socket.on("sendMsg", (data) => {
    console.log(data);
    if (users[data.receiverId]) {
      data.unread = 0;
    } else {
      data.unread = 1;
      if (users[data.receiverId + "s"]) {
        socket.to(users[data.receiverId + "s"]).emit("notify", "test");
      }
    }

    // send data to receiver
    socket.to(users[data.receiverId]).emit("receiveMsg", data);
    // send data to sender
    io.in(users[data.senderId]).emit("receiveMsg", data);

    const chatContentToDB = Chat.chatContentToDB(data);
  });

  socket.on("disconnect", (data) => {
    usersNum--;
    delete users[rusers[socket.id]];
    delete rusers[socket.id];
    console.log(users, rusers);
    console.log(`There are ${usersNum} users connected...`);
  });
  //   // socket.emit("message", "Welcome to chatbox");

  //   // // broadcast when a user connects
  //   // socket.broadcast.emit("message", "A user has joinde the chat");

// // // Runs when client disconnects
// // socket.on("disconnect", () => {
// //   io.emit("message", "A user has left the chat");
// // });
// // socket.on("chatMessage", msg => {
// //   io.emit("message", msg);
// //   console.log(msg);
// // });
});

// const sockets = [];
// const people = {};
// io.on("connection", socket => {
//   sockets.push(socket);
//   // console.log(sockets);
//   io.on("join", id => {
//     people[socket.id] = { id };
//     console.log(people);
//   });
//   io.on("disconnect", () => {
//     delete people[socket.id];
//     sockets.splice(sockets.indexOf(socket), 1);
//   });
//   io.on("initiate private message", (receiverId, message) => {
//     const receiverSocketId = findUserByName(receiverId);
//     console.log(receiverSocketId);
//     if (receiverSocketId) {
//       const receiver = people[receiverSocketId];
//       const room = getARoom(people[socket.id], receiver);

//       socket.join(room);
//       sockets[receiverSocketId].join(room);

//       io.sockets.in(room).emit("private room created", room, message);
//     }
//   });
// });

// const findUserByName = id => {
//   for (const i in people) {
//     if (people[i].id === id) {
//       return i;
//     }
//   }
//   return false;
// };

// const getARoom = (user1, user2) => {
//   return user1 + "With" + user2;
// };

server.listen(3000, () => {
  console.log("Server Started...");
});
