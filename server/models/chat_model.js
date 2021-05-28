const { query } = require("./mysqlcon");
const mysql = require("./mysqlcon");
const { toDateFormat } = require("../../util/util");

const chatContentToDB = async (data) => {
  const now = Math.floor(Date.now() / 1000);
  const { senderId, receiverId, msg, label, unread } = data;
  const chatInfo = {
    sender_id: senderId,
    receiver_id: receiverId,
    msg: msg,
    send_at: now,
    room: label,
    unread: unread
  };
  const connection = await mysql.connection();
  await connection.query("START TRANSACTION");
  const result = await query("INSERT INTO chat_msg SET ?", [chatInfo]);
  console.log(result);
  const id = result.insertId;
  return id;
};

const getChatRecord = async (id) => {
  const qryStr = `SELECT* FROM (SELECT * FROM
  (SELECT receiver_id, sender_id, msg, room, FROM_UNIXTIME(send_at) AS time,
    RANK() OVER (PARTITION BY room ORDER BY send_at DESC) ran FROM chat_msg) a
    WHERE sender_id = 24 OR receiver_id) b
    WHERE ran = 1 ORDER BY time DESC;`;
  const chatInfo = await query(qryStr);
  console.log("result", chatInfo);
  const result = { sidebar: [] };
  for (const i in chatInfo) {
    if (chatInfo[i].receiver_id != id) {
      const userInfo = await query(`SELECT name, picture FROM users WHERE id = ${chatInfo[i].receiver_id}`);
      chatInfo[i].name = userInfo[0].name;
      chatInfo[i].picture = userInfo[0].picture;
      chatInfo[i].time = await toDateFormat(chatInfo[i].time);
      chatInfo[i].msg = "我： " + chatInfo[i].msg;
      (result.sidebar).push(chatInfo[i]);
    } else {
      const userInfo = await query(`SELECT name, picture FROM users WHERE id = ${chatInfo[i].sender_id}`);
      chatInfo[i].name = userInfo[0].name;
      chatInfo[i].picture = userInfo[0].picture;
      chatInfo[i].time = await toDateFormat(chatInfo[i].time);
      chatInfo[i].msg = chatInfo[i].name + ": " + chatInfo[i].msg;
      (result.sidebar).push(chatInfo[i]);
    }
  }

  const lastChatContent = await query(`SELECT sender_id, receiver_id, msg, FROM_UNIXTIME(send_at) AS time, unread
  FROM chat_msg WHERE room = "${chatInfo[0].room}" ORDER BY time DESC`);
  result.chatbox = lastChatContent;
  console.log(chatInfo);
  return result;
};

const startAChat = async (receiverId, id) => {
  let room = "";
  if (+receiverId > +id) {
    room = id + "WITH" + receiverId;
  } else {
    room = receiverId + "WITH" + id;
  }
  console.log("receiverId", receiverId, id);
  const qryStr = `SELECT id, name, picture FROM users WHERE id = "${id}" OR id = "${receiverId}" 
  ORDER BY FIELD(id, "${id}" , "${receiverId}" )`;
  const usersInfo = await query(qryStr);
  const msg = await query(`SELECT sender_id, receiver_id, FROM_UNIXTIME(send_at) AS time, msg 
  FROM chat_msg WHERE room = "${room}"`);
  const result = {};
  result.senderInfo = usersInfo[0];
  result.receiverInfo = usersInfo[1];
  result.msg = msg;
  console.log("result:", result);
  return result;
};

module.exports = {
  chatContentToDB,
  getChatRecord,
  startAChat
};
