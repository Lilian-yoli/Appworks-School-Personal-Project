const Chat = require("../models/chat_model");

// const getChatRecord = async (req, res) => {
//   console.log(req.user);
//   const { id } = req.user;
//   const { receiverId } = req.body;
//   const result = await Chat.getChatRecord(id, receiverId);
//   if (!result) {
//     return res.status(500).send({ error: "Internal server error" });
//   }
//   return res.status(200).send(result);
// };

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

module.exports = {
  getChatRecord
};