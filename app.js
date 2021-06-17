require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const { query } = require("./server/models/mysqlcon");
const mysql = require("./server/models/mysqlcon");
// eslint-disable-next-line no-unused-vars
const API_VERSION = process.env;
const pathRoutes = require("./server/routes/path_routes");
const userRoutes = require("./server/routes/user_routes");
const passengerRoutes = require("./server/routes/passenger_route");
const chatRoutes = require("./server/routes/chat_route");
const Chat = require("./server/models/chat_model.js");
const User = require("./server/models/user_model.js");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extend: true }));
app.use(express.static("public"));
app.use(pathRoutes);
app.use(userRoutes);
app.use(passengerRoutes);
app.use(chatRoutes);

// app.use("/api/" + API_VERSION, [pathRoutes]);
// io.use((socket, next) => {
//   const token = socket.handshake.auth.verifyToken;
//   console.log(socket.handshake.auth);
//   if (token === null) {
//     const err = new Error("未登入");
//     next(err);
//   } else {
//     jwt.verify(token, "secretkey", async (error, result) => {
//       if (error) {
//         console.log(error);
//         const err = new Error("登入逾期");
//         next(err);
//       }
//       console.log("socket middleware:", result);
//       socket.userInfo = result;
//       next();
//     });
//   }
// });

const users = {};
const rusers = {};
let usersNum = 0;
io.on("connection", socket => {
  console.log("user connection", socket.id);

  usersNum++;
  console.log(`There are ${usersNum} users connected...`);
  socket.on("login", (data) => {
    if (!users[data]) {
      users[data] = [socket.id];
    } else {
      users[data].push(socket.id);
    }
    rusers[socket.id] = data;
    console.log("users", users, rusers);
    socket.emit("loginSuccess", users);
  });

  socket.on("sendMsg", (data) => {
    console.log(data);
    console.log(users[data.receiverId]);
    if (users[data.receiverId]) {
      data.unread = 0;
    } else {
      data.unread = 1;
    }

    // send data to receiver
    const receiverArr = users[data.receiverId];
    for (const i in receiverArr) {
      console.log(receiverArr[i]);
      socket.to(receiverArr[i]).emit("receiveMsg", data);
    }
    // send data to sender
    const senderArr = users[data.senderId];
    for (const i in senderArr) {
      io.in(senderArr[i]).emit("receiveMsg", data);
    }

    // eslint-disable-next-line no-unused-vars
    const chatContentToDB = Chat.chatContentToDB(data);
  });

  socket.on("disconnect", (data) => {
    usersNum--;
    const userId = rusers[socket.id];
    const totalSocketId = users[userId];
    const newSocketArr = [];
    for (const i in totalSocketId) {
      if (totalSocketId[i] !== socket.id) {
        newSocketArr.push(totalSocketId[i]);
      }
    }
    delete users[userId];
    if (newSocketArr.length > 0) { users[userId] = newSocketArr; }
    delete rusers[socket.id];
    console.log(users, rusers);
    console.log(`There are ${usersNum} users connected...`);
  });

  socket.on("notifiyPassenger", async (data) => {
    console.log(data);
    const { receiverId } = data;
    console.log("receiverId", receiverId);
    for (let i = 0; i < receiverId.length; i++) {
      data.receiverId = receiverId[i];
      console.log(data);
      console.log("**********", users[receiverId[i]]);
      let url = data.url;
      if (data.passengerRouteId) {
        url += `&passenger=${data.passengerRouteId[i]}`;
      }
      // eslint-disable-next-line no-unused-vars
      const notifyContentToDB = await Chat.notifyContentToDB(receiverId[i], data, url);
      const allNotifyContent = await Chat.allNotifyContent(receiverId[i]);
      socket.to(users[receiverId[i]]).emit("passengerReceive", allNotifyContent);
    }
  });

  socket.on("updateNotification", async (data) => {
    console.log("removeNotification", data);
    const updateNotification = await User.updateNotification(data.id);
    console.log(updateNotification);
    if (updateNotification.success) {
      const UserArr = users[data.userId];
      for (const i in UserArr) {
        io.in(UserArr[i]).emit("removeNotification", data);
      }
    }
  });
});

server.listen(3000, () => {
  console.log("Server Started...");
});
