// eslint-disable-next-line no-unused-expressions
require("dotenv").config;
const validator = require("validator");
const User = require("../models/user_model.js");

const signupInfo = async (req, res) => {
  console.log(req.body);
  const { signupName, signupEmail, signupPassword, signupPhone } = req.body;
  if (!signupName || !signupEmail || !signupPassword || !signupPhone) {
    res.status(400).send({ error: "Request Error: Name, Email, Password and Phone are required." });
    return;
  }
  // validator.isMobilePhone(signupPhone, "zh-TW");
  if (!validator.isEmail(signupEmail)) {
    res.status(400).send({ error: "Request Error: Invalid email format" });
    return;
  }
  const result = await User.signUp(signupName, signupEmail, signupPassword, signupPhone);
  if (result.error) {
    res.status(403).send({ error: result.error });
    return;
  }
  const user = result.user;
  console.log("controller_user", user);
  if (!user) {
    res.status(500).send({ error: "Database Query Error" });
    return;
  }
  res.status(200).send({
    data: {
      access_token: user.access_token,
      token_expired: user.token_expired,
      login_at: user.login_at,
      user: {
        id: user.id,
        provider: user.provider,
        name: user.name,
        email: user.email,
        phone: user.phone,
        picture: user.picture
      }
    }
  });
};

const signinInfo = async (req, res) => {
  console.log(req.body);
  const { signinEmail, signinPassword } = req.body;
  if (!signinEmail || !signinPassword) {
    res.status(400).send({ error: "Request Error: Email, Password are required." });
    return;
  }
  try {
    const result = await User.signIn(signinEmail, signinPassword);
    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return { error };
  }
};

const chatInfo = async (req, res) => {
  console.log("req.user", req.user);
  const info = req.user;
  const { id } = req.query;
  const chatInfo = await User.chatInfo(req.user.email, id);
  console.log("info", chatInfo);
  res.status(200).send(chatInfo);
};

const tokenVerify = async (req, res) => {
  console.log("req.user.name", req.user.name);
  // by default, receiver info is null
  const usersInfo = {
    userId: req.user.id,
    username: req.user.name,
    receiverId: null,
    receiverName: null
  };
  // if receiver exist, set receiver info
  console.log(req.body.receiverId);
  if (req.body.receiverId) {
    const result = await User.tokenVerify(req.body.receiverId);
    usersInfo.receiverId = req.body.receiverId;
    usersInfo.receiverName = result.name;
  }
  console.log("usersInfo", usersInfo);
  res.status(200).send(usersInfo);
};

const getUserProfile = async (req, res) => {
  console.log(req.user);
  res.status(200).send({
    data: {
      name: req.user.name,
      email: req.user.email,
      picture: req.user.picture
    }
  })
  ;
};

const getNotification = async (req, res) => {
  try {
    console.log(req.user);
    const result = await User.getNotification(req.user.id);
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  signupInfo,
  signinInfo,
  chatInfo,
  tokenVerify,
  getUserProfile,
  getNotification
};
