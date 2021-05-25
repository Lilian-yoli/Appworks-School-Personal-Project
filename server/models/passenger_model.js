// eslint-disable-next-line no-unused-vars
const { query } = require("./mysqlcon");
const mysql = require("./mysqlcon");
const { toDateFormat, toTimestamp } = require("../../util/util");

const passengerSearch = async (origin, destination, date, persons) => {
  // const timestamp = await toTimestamp(date);
  const qryStr = `SELECT origin, destination, FROM_UNIXTIME(date) AS date, time, available_seats, fee, route_id FROM offered_routes WHERE origin like"%${origin}%" AND destination like "%${destination}%" AND date = UNIX_TIMESTAMP("${date}") AND seats_left >= ${persons}`;
  const result = await query(qryStr);
  for (const i in result) {
    result[i].date = await toDateFormat(result[i].date);
  }
  console.log("passengerSearch", result);
  if (result.length < 1) {
    return null;
  } else {
    return result;
  }
};

const passengerSearchDetail = async (id) => {
  const qryStr = `SELECT o.origin, o.destination, FROM_UNIXTIME(o.date) AS date, o.time, o.available_seats, o.fee, u.name, u.picture, o.driver_email FROM offered_routes o INNER JOIN users u ON o.driver_email = u.email WHERE o.route_id = ${id}`;
  const result = await query(qryStr);
  console.log("passengerSearchDetail", result);
  result[0].date = await toDateFormat(result[0].date);
  return result;
};

const setMatchedDriver = async (id, persons, email, date) => {
  const connection = await mysql.connection();
  await connection.query("START TRANSACTION");
  const driverRoute = await query(`SELECT * FROM offered_routes WHERE route_id = ${id}`);

  console.log("driverRoute", driverRoute);
  const route = {
    origin: driverRoute[0].origin,
    destination: driverRoute[0].destination,
    persons: persons,
    email: email,
    date: date,
    origin_coordinate: driverRoute[0].origin_coordination,
    destination_coordinate: driverRoute[0].destination_coordination,
    passenger_type: "search"
  };
  console.log(route);
  const column = "(origin, destination, persons, date, email, origin_coordinate, destination_coordinate, passenger_type)";
  const setValue = `("${driverRoute[0].origin}", "${driverRoute[0].destination}", ${persons},
  UNIX_TIMESTAMP("${date}"), "${email}", Point("${driverRoute[0].origin_coordinate.x}", "${driverRoute[0].origin_coordinate.y}"),
Point("${driverRoute[0].destination_coordinate.x}", "${driverRoute[0].destination_coordinate.y}"), "search")`;

  const insertRouteTable = await query(`INSERT INTO requested_routes ${column} VALUES ${setValue}`);
  console.log(insertRouteTable);
  const passengerId = insertRouteTable.insertId;
  await connection.query("COMMIT");

  await connection.query("START TRANSACTION");
  const tour = {
    offered_routes_id: id,
    passenger_routes_id: passengerId,
    finished: 0,
    passenger_type: "search"
  };
  const insertInfo = await query("INSERT INTO tour SET ?", tour);
  const updateSeats = await query(`UPDATE offered_routes SET seats_left = 
  (SELECT v2.seats_left FROM (SELECT v1.seats_left FROM offered_routes v1 WHERE route_id = ${id}) v2) - ${persons} WHERE route_id = ${id}`);
  await connection.query("COMMIT");
  console.log("insertInfo", insertInfo);
  console.log("insertInfo", updateSeats);
  const insertId = insertInfo.insertId;
  return insertId;
};

const getPassengerItinerary = async (email) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const qryStr = `SELECT o.origin, o.destination, FROM_UNIXTIME(o.date + 28800) AS date, o.time, o.fee, t.tour_id, r.persons, u.name, u.picture FROM requested_routes r
  INNER JOIN tour t ON r.route_id = t.passenger_routes_id
  INNER JOIN offered_routes o ON t.offered_routes_id = o.route_id
  INNER JOIN users u ON u.email = o.driver_email
  WHERE r.email = "${email}" AND UNIX_TIMESTAMP(o.routeTS) >= ${timestamp}`;
  const result = await query(qryStr);
  for (const i in result) {
    result[i].date = await toDateFormat(result[i].date);
  }
  console.log("getPassengerItinerary", result);
  return result;
};

const passengerRequestDetail = async (email) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const result = await query(`SELECT origin, destination, persons, FROM_UNIXTIME(date + 28800) AS date FROM requested_routes WHERE offered_routes_id = 0 AND email = "${email}"`);
  for (const i in result) {
    result[i].date = await toDateFormat(result[i].date);
  }
  console.log("passengerRequestDetail", result);
  return result;
};

module.exports = {
  passengerSearch,
  passengerSearchDetail,
  setMatchedDriver,
  getPassengerItinerary,
  passengerRequestDetail
};
