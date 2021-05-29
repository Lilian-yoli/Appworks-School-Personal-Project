const { query } = require("./mysqlcon");
const mysql = require("./mysqlcon");
const { toDateFormat } = require("../../util/util");

const chatContentToDB = async (data) => {
  const now = Math.floor(Date.now() / 1000);
  const { senderId, receiverId, msg, room, unread } = data;
  const chatInfo = {
    sender_id: senderId,
    receiver_id: receiverId,
    msg: msg,
    send_at: now,
    room: room,
    unread: unread
  };
  const connection = await mysql.connection();
  await connection.query("START TRANSACTION");
  const result = await query("INSERT INTO chat_msg SET ?", [chatInfo]);
  console.log(result);
  const id = result.insertId;
  return id;
};

const getChatRecord = async (receiverId, id, name, room) => {
  const result = { };
  console.log("123", receiverId, id, name, room);
  const qryStr = `SELECT* FROM (SELECT * FROM
    (SELECT receiver_id, sender_id, msg, room, unread, FROM_UNIXTIME(send_at) AS time,
      RANK() OVER (PARTITION BY room ORDER BY send_at DESC) ran FROM chat_msg) a
      CROSS JOIN (SELECT SUM(unread) not_read FROM chat_msg) b
      WHERE sender_id = ${id} OR receiver_id = ${id}) c
      WHERE ran = 1 ORDER BY time DESC;`;
  const chatInfo = await query(qryStr);
  result.sidebar = chatInfo;
  console.log("result", chatInfo);

  if (receiverId) {
    const updateUnread = await query(`UPDATE chat_msg SET unread = 0 WHERE room = "${room}"`);
    const getTheSidebar = await query(`SELECT a.msg, a.sender_id, a.receiver_id, a.room, b.unread, FROM_UNIXTIME(a.send_at + 28800) AS time FROM chat_msg a
            CROSS JOIN (SELECT SUM(unread) not_read FROM chat_msg) b 
            WHERE a.room = "${room}" ORDER BY time DESC LIMIT 1`);
    const getTheChat = await query(`SELECT sender_id, receiver_id, msg, FROM_UNIXTIME(send_at + 28800) AS time FROM chat_msg
    WHERE room = "${room}" ORDER BY time`);
    result.firstSidebar = getTheSidebar;
    result.firstChatMsg = getTheChat;
    console.log("getChatRecord", result);
  } else {
    const updateUnread = await query(`UPDATE chat_msg SET unread = 0 WHERE room = "${room}"`);
    const lastChatContent = await query(`SELECT sender_id, receiver_id, msg, FROM_UNIXTIME(send_at) AS time, unread
  FROM chat_msg WHERE room = "${chatInfo[0].room}" ORDER BY time`);
    result.chatMsg = lastChatContent;
  }

  //   for (const i in chatInfo) {
  //     // exculde on-chatting one
  //     if (chatInfo[i].receiver_id != receiverId) {
  //       if (chatInfo[i].receiver_id != id) {
  //         const userInfo = await query(`SELECT name, picture FROM users
  //                 WHERE id = ${chatInfo[i].receiver_id} `);
  //         chatInfo[i].userId = id;
  //         chatInfo[i].sidebarName = userInfo[0].name;
  //         chatInfo[i].sidebar_pic = userInfo[0].picture;
  //         chatInfo[i].time = await toDateFormat(chatInfo[i].time);
  //         chatInfo[i].msg = "我： " + chatInfo[i].msg;
  //         (result.sidebar).push(chatInfo[i]);
  //       } else {
  //         const userInfo = await query(`SELECT name, picture FROM users
  //                 WHERE id = ${chatInfo[i].sender_id}`);
  //         chatInfo[i].userId = id;
  //         chatInfo[i].sidebarName = userInfo[0].name;
  //         chatInfo[i].sidebarPic = userInfo[0].picture;
  //         chatInfo[i].time = await toDateFormat(chatInfo[i].time);
  //         chatInfo[i].msg = userInfo[0].name + ": " + chatInfo[i].msg;
  //         (result.sidebar).push(chatInfo[i]);
  //       }
  //     }
  //   }
  if (id != chatInfo[0].sender_id) {
    receiverId = chatInfo[0].sender_id;
  } else {
    receiverId = chatInfo[0].receiver_id;
  }
  if (!room) {
    room = chatInfo[0].room;
  }
  const usersInfo = await query(`SELECT name, picture FROM users 
  WHERE id = ${id} OR id = ${receiverId} ORDER BY FIELD(id, ${id}, ${receiverId})`);
  result.usersInfo = {
    userId1: id,
    username1: name,
    userId2: receiverId,
    username2: usersInfo[1].name,
    userPicture1: usersInfo[0].picture,
    userPicture2: usersInfo[1].picture,
    room: room
  };
  return result;

  //   const qryStr = `SELECT* FROM (SELECT * FROM
  //   (SELECT receiver_id, sender_id, msg, room, FROM_UNIXTIME(send_at) AS time,
  //     RANK() OVER (PARTITION BY room ORDER BY send_at DESC) ran FROM chat_msg) a
  //     WHERE sender_id = ${id} OR receiver_id = ${id}) b
  //     WHERE ran = 1 ORDER BY time DESC;`;
  //   const chatInfo = await query(qryStr);
  //   console.log("result", chatInfo);
  //   const result = { sidebar: [] };
  //   for (const i in chatInfo) {
  //     // exculde on-chatting one
  //     if (chatInfo[i].receiver_id != receiverId) {
  //       if (chatInfo[i].receiver_id != id) {
  //         const userInfo = await query(`SELECT name, picture FROM users
  //             WHERE id = ${chatInfo[i].receiver_id} `);
  //         chatInfo[i].userId = id;
  //         chatInfo[i].sidebarName = userInfo[0].name;
  //         chatInfo[i].sidebar_pic = userInfo[0].picture;
  //         chatInfo[i].time = await toDateFormat(chatInfo[i].time);
  //         chatInfo[i].msg = "我： " + chatInfo[i].msg;
  //         (result.sidebar).push(chatInfo[i]);
  //       } else {
  //         const userInfo = await query(`SELECT name, picture FROM users
  //             WHERE id = ${chatInfo[i].sender_id}`);
  //         chatInfo[i].userId = id;
  //         chatInfo[i].sidebarName = userInfo[0].name;
  //         chatInfo[i].sidebarPic = userInfo[0].picture;
  //         chatInfo[i].time = await toDateFormat(chatInfo[i].time);
  //         chatInfo[i].msg = userInfo[0].name + ": " + chatInfo[i].msg;
  //         (result.sidebar).push(chatInfo[i]);
  //       }
  //     }
  //   }

//   const lastChatContent = await query(`SELECT sender_id, receiver_id, msg, FROM_UNIXTIME(send_at) AS time, unread
//   FROM chat_msg WHERE room = "${chatInfo[0].room}" ORDER BY time`);
//   result.chatbox = lastChatContent;
//   console.log(chatInfo);
//   return result;
};

const startAChat = async (receiverId, id, room) => {
//   let room = "";
//   if (+receiverId > +id) {
//     room = id + "WITH" + receiverId;
//   } else {
//     room = receiverId + "WITH" + id;
//   }
  console.log("receiverId", receiverId, id);
  const qryStr = `SELECT id, name, picture FROM users WHERE id = "${receiverId}"`;
  const receiverInfo = await query(qryStr);
  const msg = await query(`SELECT sender_id, receiver_id, FROM_UNIXTIME(send_at) AS time, msg, room 
  FROM chat_msg WHERE room = "${room}" ORDER BY time`);
  const sidebar = { sidebarName: receiverInfo[0].name };
  sidebar.userId = id;
  sidebar.theOtherId = receiverId;
  sidebar.sidebarPic = receiverInfo[0].picture;
  sidebar.time = await toDateFormat(msg[msg.length - 1].time);
  sidebar.room = room;
  const sidebarArr = [];
  sidebarArr.push(sidebar);
  const result = { sidebar: sidebarArr };
  if (msg[msg.length - 1].sender_id == id) {
    result.sidebar[0].msg = "你：" + msg[msg.length - 1].msg;
  } else {
    result.sidebar[0].msg = receiverInfo[0].name + ":" + msg[msg.length - 1].msg;
  }

  result.chatbox = msg;
  console.log("result:", result);
  return result;
};

module.exports = {
  chatContentToDB,
  getChatRecord,
  startAChat
};