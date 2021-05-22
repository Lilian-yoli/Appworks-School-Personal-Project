require("dotenv").config();
const bcrypt = require("bcrypt");
const mysql = require("./mysqlcon");
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
      phone: phone,
      picture: null,
      login_at: loginAt,
      token_expired: TOKEN_EXPIRE
    };
    const accessToken = jwt.sign({
      provider: user.provider,
      name: user.name,
      email: user.email,
      phone: user.phone,
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
  await connection.query("START TRANSACTION");
  const users = await connection.query("SELECT email, password FROM users WHERE email = ?", [email]);
  const user = users[0];
  console.log(!bcrypt.compareSync(password, user.password));
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
  const queryStr = "UPDATE users SET access_token = ?, token_expired = ?, login_at = ? WHERE user_id = ?";
  // eslint-disable-next-line no-unused-vars
  const updateUser = connection.query(queryStr, [accessToken, TOKEN_EXPIRE, loginAt, user.id]);

  await connection.query("COMMIT");
  console.log("beforeReturn", user);
  return user;
};

const getUserDetail = async (email) => {
  const connection = await mysql.connection();
  const result = await connection.query("SELECT * FROM users WHERE email = ?", [email]);
  console.log("getUserDetail:", result);
  return result;
};

module.exports = {
  signUp,
  signIn,
  getUserDetail
};
