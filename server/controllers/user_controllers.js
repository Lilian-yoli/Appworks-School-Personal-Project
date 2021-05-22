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

module.exports = {
  signupInfo,
  signinInfo
};
