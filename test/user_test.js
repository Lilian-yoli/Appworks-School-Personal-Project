require("dotenv").config();
const { assert, requester } = require("./set_up");
const { users } = require("./fake_data");
const { query } = require("../server/models/mysqlcon");

const expectedExpireTime = process.env.TOKEN_EXPIRE;

describe("User", () => {
  it("sign up", async () => {
    const user = {
      signupName: "lilian",
      signupEmail: "lilian@gmail.com",
      signupPassword: "password"
    };
    const res = await requester
      .post("/api/1.0/user/signup")
      .send(user);
    console.log(res.body);
    const data = res.body.data;

    const userExpect = {
      id: data.user.id,
      provider: "native",
      name: user.signupName,
      email: user.signupEmail,
      picture: "../uploads/images/member.png"
    };

    assert.deepEqual(data.user, userExpect);
    assert.isString(data.access_token);
    assert.equal(data.token_expired, expectedExpireTime);
    assert.closeTo(new Date(data.login_at).getTime(), Date.now(), 1000);
  });

  it("sign up without email, name or password", async () => {
    const user1 = {
      signupEmail: "lilian@gmail.com",
      signupPassword: "password"
    };
    const res1 = await requester
      .post("/api/1.0/user/signup")
      .send(user1);

    assert.equal(res1.statusCode, 400);

    const user2 = {
      signupName: "lilian",
      signupPassword: "password"
    };
    const res2 = await requester
      .post("/api/1.0/user/signup")
      .send(user2);

    assert.equal(res2.statusCode, 400);

    const user3 = {
      signupName: "lilian",
      signupEmail: "lilian@gmail.com"
    };
    const res3 = await requester
      .post("/api/1.0/user/signup")
      .send(user3);

    assert.equal(res3.statusCode, 400);
  });

  it("sign up with email registered before", async () => {
    const user = {
      signupName: "lilian",
      signupEmail: users[0].email,
      signupPassword: "password"
    };

    const res = await requester
      .post("/api/1.0/user/signup")
      .send(user);

    assert.equal(res.body.error, "Email already existed");
  });

  it("sign up with malicious email", async () => {
    const user = {
      signupName: "lilian",
      signupEmail: "123",
      signupPassword: "password"
    };

    const res = await requester
      .post("/api/1.0/user/signup")
      .send(user);

    assert.equal(res.body.error, "Request Error: Invalid email format");
  });

  it("native sign in with correct password", async () => {
    const user1 = users[0];

    const user = {
      signinEmail: user1.email,
      signinPassword: user1.password
    };
    console.log("%%%%%%%%%", user1, user);
    const res = await requester
      .post("/api/1.0/user/signin")
      .send(user);

    const data = res.body.data;

    const userExpect = {
      id: data.user.id,
      provider: user1.provider,
      name: user1.name,
      email: user1.email,
      picture: "../uploads/images/member.png"
    };

    assert.deepEqual(data.user, userExpect);
    assert.isString(data.access_token);
    assert.equal(data.token_expired, expectedExpireTime);

    const [longTime] = await query(
      "SELECT login_at FROM users WHERE email = ?",
      [user.signinEmail]);
    console.log(longTime);
    assert.closeTo(new Date(data.login_at).getTime(), Date.now(), 5000);
    assert.closeTo(new Date(longTime.login_at).getTime(), Date.now(), 5000);
  });

  it("native sign in without email", async () => {
    const user1 = users[0];
    const user = {
      signinPassword: user1.password
    };

    const res = await requester
      .post("/api/1.0/user/signin")
      .send(user);

    const data = res.body.data;

    assert.equal(res.body.error, "Request Error: Email, Password are required.");
  });

  it("native sign in without email", async () => {
    const user1 = users[0];
    const user = {
      signinEmail: user1.email
    };

    const res = await requester
      .post("/api/1.0/user/signin")
      .send(user);

    const data = res.body.data;

    assert.equal(res.body.error, "Request Error: Email, Password are required.");
  });

  it("Email not resgistered yet", async () => {
    const user = {
      signinEmail: "123@123.com",
      signinPassword: users[0].password
    };

    const res = await requester
      .post("/api/1.0/user/signin")
      .send(user);
    console.log(res.body);

    assert.equal(res.body.error, "Email not yet registered");
  });

  it("sign in with invalid password", async () => {
    const user = {
      signinEmail: users[0].email,
      signinPassword: "123"
    };

    const res = await requester
      .post("/api/1.0/user/signin")
      .send(user);
    console.log(res.body);

    assert.equal(res.body.error, "Invalid password");
  });
});
