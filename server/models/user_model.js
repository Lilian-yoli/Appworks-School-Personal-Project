require("dotenv").config();
const bcrypt = require("bcrypt");
const mysql = require("./mysqlcon");
const { query } = require("./mysqlcon");
const salt = parseInt(process.env.BCRYPT_SALT);
const { TOKEN_EXPIRE, TOKEN_SECRET } = process.env;
const jwt = require("jsonwebtoken");

const signUp = async (name, email, password, phone) => {
  try {
    const connection = await mysql.connection();
    await connection.query("START TRANSACTION");
    const emails = await connection.query("SELECT email FROM users WHERE email = ? FOR UPDATE", [email]);
    if (emails.length > 0) {
      await connection.query("COMMIT");
      return { error: "Email already existed" };
    }

    const loginAt = new Date();
    const user = {
      provider: "native",
      name: name,
      email: email,
      password: bcrypt.hashSync(password, salt),
      picture: "../uploads/images/member.png",
      login_at: loginAt,
      token_expired: TOKEN_EXPIRE
    };
    const accessToken = jwt.sign({
      provider: user.provider,
      name: user.name,
      email: user.email,
      picture: user.picture
    }, TOKEN_SECRET, { expiresIn: TOKEN_EXPIRE * 1000 });
    user.access_token = accessToken;
    const queryStr = "INSERT INTO users SET ?";
    const result = await connection.query(queryStr, user);
    user.id = result.insertId;
    await connection.query("COMMIT");
    return { user };
  } catch (error) {
    console.log(error);
    await mysql.connection().query("ROLLBACK");
    return error;
  }
};

const signIn = async (email, password) => {
  const connection = await mysql.connection();
  try {
    await connection.query("START TRANSACTION");
    const users = await connection.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length < 1) {
      return { error: "Email not yet registered" };
    }
    const user = users[0];
    if (!bcrypt.compareSync(password, user.password)) {
      await connection.query("COMMIT");
      return { error: "Invalid password" };
    }
    const accessToken = jwt.sign({
      provider: user.provider,
      name: user.name,
      email: user.email,
      phone: user.phone,
      picture: user.picture
    }, TOKEN_SECRET, { expiresIn: TOKEN_EXPIRE * 1000 });

    const loginAt = new Date();
    user.access_token = accessToken;
    user.login_at = loginAt;
    user.token_expired = TOKEN_EXPIRE;
    const queryStr = "UPDATE users SET access_token = ?, token_expired = ?, login_at = ? WHERE id = ?";
    // eslint-disable-next-line no-unused-vars
    const updateUser = connection.query(queryStr, [accessToken, TOKEN_EXPIRE, loginAt, user.id]);
    await connection.query("COMMIT");
    return user;
  } catch (err) {
    console.log(err);
  }
};

const getUserDetail = async (email) => {
  try {
    const result = await query("SELECT * FROM users WHERE email = ?", [email]);
    return result;
  } catch (err) {
    console.log(err);
  }
};

const tokenVerify = async (receiverId) => {
  const result = await query(`SELECT name FROM users WHERE id = ${receiverId}`);
  return result[0];
};

module.exports = {
  signUp,
  signIn,
  getUserDetail,
  tokenVerify
};
