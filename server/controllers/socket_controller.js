const Chat = require("../models/chat_model.js");
const User = require("../models/user_model.js");

const users = {};
const rusers = {};
let usersNum = 0;

const socketCon = (io) => {
  io.on("connection", socket => {
    usersNum++;
    console.log(`There are ${usersNum} users connected...`);
    socket.on("login", (data) => {
      if (!users[data]) {
        users[data] = [socket.id];
      } else {
        users[data].push(socket.id);
      }
      rusers[socket.id] = data;
      socket.emit("loginSuccess", users);
    });

    socket.on("sendMsg", (data) => {
      if (users[data.receiverId]) {
        data.unread = 0;
      } else {
        data.unread = 1;
      }

      // send data to receiver
      const receiverArr = users[data.receiverId];
      for (const i in receiverArr) {
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
      console.log(`There are ${usersNum} users connected...`);
    });

    socket.on("notifyPassenger", async (data) => {
      try {
        console.log("notifyPassenger", data);
        const { receiverId } = data;
        for (let i = 0; i < receiverId.length; i++) {
          data.receiverId = receiverId[i];
          let url = data.url;
          if (data.passengerRouteId) {
            url += `&passenger=${data.passengerRouteId[i]}`;
          }
          // eslint-disable-next-line no-unused-vars
          const notifyContentToDB = await Chat.notifyContentToDB(receiverId[i], data, url);
          const allNotifyContent = await Chat.allNotifyContent(receiverId[i]);
          console.log(notifyContentToDB, allNotifyContent);
          socket.to(users[receiverId[i]]).emit("passengerReceive", allNotifyContent);
        }
      } catch (err) {
        console.log(err);
      }
    });

    socket.on("updateNotification", async (data) => {
      try {
        console.log("socket");
        const updateNotification = await Chat.updateNotification(data.id);
        if (updateNotification.success) {
          const UserArr = users[data.userId];
          for (const i in UserArr) {
            io.in(UserArr[i]).emit("removeNotification", data);
          }
        }
      } catch (err) {
        console.log(err);
      }
    });
  });
};

module.exports = {
  socketCon
};
