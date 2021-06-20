require("dotenv").config();
const { NODE_ENV } = process.env;
const bcyrpt = require("bcrypt");
const { users, offeredRoutes } = require("./fake_data");
const { query } = require("../server/models/mysqlcon");
const mysql = require("../server/models/mysqlcon");
const { end } = require("../server/models/mysqlcon");
const salt = parseInt(process.env.BCRYPT_SALT);
const Util = require("../util/util");

function _createFakeUser () {
  const encrypted_users = users.map(user => {
    const encrypted_user = {
      provider: user.provider,
      email: user.email,
      password: user.password ? bcyrpt.hashSync(user.password, salt) : null,
      name: user.name,
      picture: user.picture,
      access_token: user.access_token,
      access_expire: user.access_expired,
      login_at: user.login_at
    };
    return encrypted_user;
  });
  console.log(encrypted_users);
  return query("INSERT INTO users (provider, email, password, name, picture, access_token, token_expired, login_at) VALUES ?", [encrypted_users.map(x => Object.values(x))]);
}

async function _createFakeOfferedRoutes () {
  // const offeredRoutesWithLatLng =  offeredRoutes.map( (route) => {
  //   const offeredRouteWithLatLng = {
  //     date: route.date,
  //     destination: route.destination,
  //     origin: route.origin,
  //     available_seats: route.avaiable_seats,
  //     seats_left: route.seats_left,
  //     time: route.time,
  //     user_id: route.user_id,
  //     origin_coordinate: "POINT(\"25.0410127\", \"121.5651638\")",
  //     destination_coordinate: "POINT(\"25.0636811\", \"121.5518476\")",
  //     route_timestamp: `${route.date} ${route.time}`
  //   };
  //   console.log(offeredRouteWithLatLng);
  //   return offeredRouteWithLatLng;
  // });const conn = await mysql.connection();
  const conn = await mysql.connection();

  for (const route of offeredRoutes) {
    const insert = `(UNIX_TIMESTAMP("${route.date}"), "${route.origin}", "${route.destination}", ${route.avaiable_seats}, ${route.seats_left}, "${route.time}", 
    ${route.user_id}, Point(25.0410127, 121.5651638), Point(25.0410127, 121.5651638),TIMESTAMP("${route.date}", "${route.time}"))`;
    await conn.query("START TRANSACTION");
    await conn.query.removeConstraint("offered_routes", "offered_routes_ibfk_1");
    await conn.query(`INSERT INTO offered_routes (date, destination, origin, available_seats, seats_left, time, user_id, origin_coordinate, destination_coordinate, route_timestamp) VALUES ${insert}`);
    await conn.query("SET FOREIGN_KEY_CHECKS = ?", 1);
    await conn.query("COMMIT");
    conn.release();
  };
}

function createFakeData () {
  if (NODE_ENV !== "test") {
    console.log("Not in test env");
    return;
  }
  return _createFakeUser()
    .then(_createFakeOfferedRoutes)
    .catch(console.log);
}

async function truncateFakeData () {
  if (NODE_ENV !== "test") {
    console.log("Not in test env");
    return;
  }

  const truncateTable = async (table) => {
    const conn = await mysql.connection();
    await conn.query("START TRANSACTION");
    await conn.query("SET FOREIGN_KEY_CHECKS = ?", 0);
    await conn.query(`TRUNCATE TABLE ${table}`);
    await conn.query("SET FOREIGN_KEY_CHECKS = ?", 1);
    await conn.query("COMMIT");
    conn.release();
  };
  await truncateTable("users");
  await truncateTable("offered_routes");
}

function closeConnection () {
  return end();
}

// execute when called directly.
if (require.main === module) {
  console.log("main");
  truncateFakeData()
    .then(createFakeData)
    .then(closeConnection);
}

module.exports = {
  createFakeData,
  truncateFakeData,
  closeConnection
};
