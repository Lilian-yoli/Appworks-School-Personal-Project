// eslint-disable-next-line no-unused-expressions
require("dotenv").config;
const validator = require("validator");
const User = require("../models/user_model.js");

const signupInfo = async (req, res) => {
  const { signupName, signupEmail, signupPassword } = req.body;
  if (!signupName || !signupEmail || !signupPassword) {
    res.status(400).send({ error: "Request Error: Name, Email and Password are required." });
    return;
  }

  if (!validator.isEmail(signupEmail)) {
    res.status(400).send({ error: "Request Error: Invalid email format" });
    return;
  }
  const result = await User.signUp(signupName, signupEmail, signupPassword);
  if (result.error) {
    res.status(403).send({ error: result.error });
    return;
  }
  const user = result.user;
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
    const userInfo = await User.signIn(signinEmail, signinPassword);
    if (userInfo.error) {
      return res.status(400).send(userInfo);
    }
    return res.status(200).send({
      data: {
        access_token: userInfo.access_token,
        token_expired: userInfo.token_expired,
        login_at: userInfo.login_at,
        user: {
          id: userInfo.id,
          provider: userInfo.provider,
          name: userInfo.name,
          email: userInfo.email,
          phone: userInfo.phone,
          picture: userInfo.picture
        }
      }
    });
  } catch (error) {
    console.log(error);
    return { error };
  }
};

const tokenVerify = async (req, res) => {
  // by default, receiver info is null
  const usersInfo = {
    userId: req.user.id,
    username: req.user.name,
    receiverId: null,
    receiverName: null
  };
  // if receiver exist, set receiver info
  if (req.body.receiverId) {
    const result = await User.tokenVerify(req.body.receiverId);
    usersInfo.receiverId = req.body.receiverId;
    usersInfo.receiverName = result.name;
  }
  res.status(200).send(usersInfo);
};

const getUserProfile = async (req, res) => {
  res.status(200).send({
    data: {
      name: req.user.name,
      email: req.user.email,
      picture: req.user.picture
    }
  })
  ;
};

module.exports = {
  signupInfo,
  signinInfo,
  tokenVerify,
  getUserProfile
};
