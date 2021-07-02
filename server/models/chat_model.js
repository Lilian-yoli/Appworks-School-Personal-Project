const { query } = require("./mysqlcon");
const mysql = require("./mysqlcon");
const { toDateFormat } = require("../../util/util");

const chatContentToDB = async (data) => {
  const connection = await mysql.connection();
  try {
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
    await connection.query("START TRANSACTION");
    const result = await query("INSERT INTO chat_msg SET ?", [chatInfo]);
    const id = result.insertId;
    await connection.query("COMMIT");
    return id;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const getChatRecord = async (receiverId, id, name, room) => {
  const conn = await mysql.connection();
  try {
    const result = {};
    const qryStr = `SELECT sender_id, receiver_id, msg, time, room, unread, c.id AS receiverUserId, 
  c.name AS receiverUserName, c.picture AS receiverUserPicture, senderUserId, senderUserName, senderUserPicture 
   FROM (SELECT * FROM (SELECT receiver_id, sender_id, msg, room, unread, FROM_UNIXTIME(send_at) AS time,
      RANK() OVER (PARTITION BY room ORDER BY send_at DESC) ran FROM chat_msg) a
      CROSS JOIN (SELECT SUM(unread) not_read FROM chat_msg WHERE receiver_id = ${id}) b
      INNER JOIN (SELECT u.id AS senderUserId, u.name AS senderUserName, u.picture AS senderUserPicture FROM users u 
        INNER JOIN users u2 ON u.id = u2.id) d ON sender_id = d.senderUserId
        INNER JOIN users d ON receiver_id = d.id
      WHERE sender_id = ${id} OR receiver_id = ${id}) c
      WHERE ran = 1 ORDER BY time DESC;`;
    const chatInfo = await query(qryStr);
    result.sidebar = chatInfo;

    if (chatInfo.length > 0) {
      if (receiverId) {
        const updateUnread = await query("UPDATE chat_msg SET unread = 0 WHERE room = ?", [room]);
        const getTheSidebar = await query(`SELECT a.msg, a.sender_id, a.receiver_id, a.room, FROM_UNIXTIME(a.send_at) AS time FROM chat_msg a
            CROSS JOIN (SELECT SUM(unread) not_read FROM chat_msg) b 
            WHERE a.room = "${room}" ORDER BY time DESC LIMIT 1`);
        const getTheChat = await query(`SELECT sender_id, receiver_id, msg, FROM_UNIXTIME(send_at) AS time FROM chat_msg
    WHERE room = "${room}" ORDER BY time`);
        result.firstSidebar = getTheSidebar;
        result.firstChatMsg = getTheChat;
        await conn.query("COMMIT");
      } else {
        if (chatInfo[0].sender_id == id) {
          receiverId = chatInfo[0].receiver_id;
        } else {
          receiverId = chatInfo[0].sender_id;
        }
        const updateUnread = await query("UPDATE chat_msg SET unread = 0 WHERE room = ?", [chatInfo[0].room]);
        const lastChatContent = await query(`SELECT sender_id, receiver_id, msg, FROM_UNIXTIME(send_at) AS time, unread
  FROM chat_msg WHERE room = ? ORDER BY time`, [chatInfo[0].room]);
        result.chatMsg = lastChatContent;
      }

      if (!room) {
        room = chatInfo[0].room;
      }
    }

    if (!receiverId && chatInfo.length < 1) {
      return null;
    }
    let now = new Date().toLocaleString();
    now = now.split(" ")[0];
    now = now.replace("/", "-");
    now = now.replace("/", "-");
    const usersInfo = await query(`SELECT name, picture FROM users 
  WHERE id = ${id} OR id = ${receiverId} ORDER BY FIELD(id, ${id}, ${receiverId})`);
    result.usersInfo = {
      userId1: id,
      username1: name,
      userId2: receiverId,
      username2: usersInfo[1].name,
      userPicture1: usersInfo[0].picture,
      userPicture2: usersInfo[1].picture,
      room: room,
      now
    };
    return result;
  } catch (err) {
    console.log(err);
  }
};

const startAChat = async (receiverId, id, room) => {
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
  return result;
};

const notifyContentToDB = async (receiverId, data, url) => {
  const now = Math.floor(Date.now() / 1000);
  const notificationInfo = {
    user_id: receiverId,
    content: data.content,
    type: data.type,
    time: now,
    unread: 1,
    url: url
  };
  const connection = await mysql.connection();
  await connection.query("START TRANSACTION");
  const result = await query("INSERT INTO notification SET ?", [notificationInfo]);
  await connection.query("COMMIT");
  return receiverId;
};

const allNotifyContent = async (receiverId) => {
  try {
    const result = await query(`SELECT a.content, a.url, b.unread FROM notification a
  CROSS JOIN(SELECT SUM(unread) unread FROM notification WHERE user_id = ${receiverId} AND unread = 1) b
  WHERE user_id = ${receiverId} AND a.unread = 1 ORDER BY time DESC`);
    return result;
  } catch (err) {
    console.log(err);
  }
};

const getNotification = async (id) => {
  try {
    const result = await query("SELECT * FROM notification WHERE user_id = ? AND unread = 1 ORDER BY time DESC", id);
    if (result.length < 1) {
      return { empty: "User has no notification" };
    }
    return result;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const updateNotification = async (id, url) => {
  const result = await query("UPDATE notification SET unread = 0 WHERE user_id = ? AND url = ?", [id, url]);
  if (result < 1) {
    return { error: "Internal server error" };
  }
  console.log(result);
  return { success: "success" };
};

module.exports = {
  chatContentToDB,
  getChatRecord,
  startAChat,
  notifyContentToDB,
  allNotifyContent,
  updateNotification,
  getNotification
};
