const Chat = require("../models/chat_model");

const getChatRecord = async (req, res) => {
  console.log(req.user);
  const { id } = req.user;
  const result = await Chat.getChatRecord(id);
  if (!result) {
    return res.status(500).send({ error: "Internal server error" });
  }
  return res.status(200).send(result);
};

const startAChat = async (req, res) => {
  console.log("req.body", req.body);
  const { receiverId } = req.body;
  console.log(123);
  const { id } = req.user;
  const result = await Chat.startAChat(receiverId, id);
  if (!result) {
    return res.status(500).send({ error: "Internal server error" });
  }
  console.log("startAChat", result);
  res.status(200).send(result);
};

module.exports = {
  getChatRecord,
  startAChat
};
