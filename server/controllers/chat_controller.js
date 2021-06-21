const Chat = require("../models/chat_model");

const getChatRecord = async (req, res) => {
  const { room } = req.query;
  const { id, name } = req.user;
  let receiverId = "";
  if (room) {
    const roomArr = room.split("WITH");
    if (roomArr[0] == id) { receiverId = roomArr[1]; } else { receiverId = roomArr[0]; }
  }
  console.log("receiverId", receiverId);
  const result = await Chat.getChatRecord(receiverId, id, name, room);
  if (!result) {
    return res.status(500).send({ error: "Internal server error" });
  }
  console.log("startAChat", result);
  res.status(200).send(result);
};

const getNotification = async (req, res) => {
  try {
    console.log(req.user);
    const result = await Chat.getNotification(req.user.id);
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  getChatRecord,
  getNotification
};
