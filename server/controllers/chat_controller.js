const Chat = require("../models/chat_model");

const getChatRecord = async (req, res) => {
  try {
    const { room } = req.query;
    const { id, name } = req.user;
    let receiverId = "";
    if (room) {
      const roomArr = room.split("WITH");
      if (roomArr[0] != id && roomArr[1] != id) {
        return res.status(401).send({ error: "Unauthorized" });
      } else if (roomArr[0] == id) { receiverId = roomArr[1]; } else { receiverId = roomArr[0]; }
    }
    const result = await Chat.getChatRecord(receiverId, id, name, room);
    if (!result) {
      return res.status(200).send({ empty: "no chat record" });
    }
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
  }
};

const getNotification = async (req, res) => {
  try {
    const result = await Chat.getNotification(req.user.id);
    if (!result) {
      return res.status(500).send({ error: "Internal server error." });
    }
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  getChatRecord,
  getNotification
};
