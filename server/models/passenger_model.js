// eslint-disable-next-line no-unused-vars
const { query } = require("./mysqlcon");
const mysql = require("./mysqlcon");
const { toDateFormat, toTimestamp, transferToLatLng, getDistanceFromLatLonInKm } = require("../../util/util");

const requestSeatsInfo = async (origin, destination, persons, date, id) => {
  const connection = await mysql.connection();
  await connection.query("START TRANSACTION");
  const queryStr = `SELECT * FROM requested_routes WHERE origin = "${origin}" AND destination = "${destination}" AND persons = ${persons} AND date = UNIX_TIMESTAMP("${date}") AND user_id = ${id} FOR UPDATE`;

  const checkDuplicatedRoute = await query(queryStr);
  console.log("checkDuplicatedRoute", checkDuplicatedRoute);
  if (checkDuplicatedRoute.length > 0) {
    await connection.query("COMMIT");
    return { error: "Routes had already been created, please check your itinerary" };
  }
  const originLatLng = await transferToLatLng(origin);
  const destinationLatLng = await transferToLatLng(destination);
  const now = Math.floor(Date.now() / 1000);
  console.log("originLatLng", originLatLng.lat, originLatLng.lng);
  if (!originLatLng || !destinationLatLng) {
    return { error: "Couldn't find the origin. Try to type the address." };
  } else if (!destinationLatLng) {
    return { error: "Couldn't find the destination. Try to type the address." };
  }
  const distance = getDistanceFromLatLonInKm(originLatLng.lat, originLatLng.lng, destinationLatLng.lat, destinationLatLng.lng);

  const columns = `(origin, destination, persons, date, user_id, origin_coordinate, 
      destination_coordinate, passenger_type, isMatched, createdAt, updatedAt, distance)`;

  const setValue = `("${origin}", "${destination}", "${persons}",
    UNIX_TIMESTAMP("${date}"), ${id}, Point("${originLatLng.lat}", "${originLatLng.lng}"),
  Point("${destinationLatLng.lat}", "${destinationLatLng.lng}"), "request", 0, UNIX_TIMESTAMP("${now}"), UNIX_TIMESTAMP("${now}"), ${distance})`;

  const insertRoute = await query(`INSERT INTO requested_routes ${columns} VALUES ${setValue}`);
  console.log("insertRoute", insertRoute);
  const routeId = insertRoute.insertId;
  const route = await query(`SELECT * FROM requested_routes WHERE route_id = ${routeId}`);
  await connection.query("COMMIT");
  console.log("MAKE COMPARISON", route);
  console.log("route[0].origin_coordinate.x", route[0].origin_coordinate.x);
  return { route };
};

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
  const qryStr = `SELECT o.origin, o.destination, FROM_UNIXTIME(o.date) AS date, o.time, o.available_seats, o.fee, u.name, u.picture, u.id 
  FROM offered_routes o INNER JOIN users u ON o.user_id = u.id WHERE o.route_id = ${id}`;
  const result = await query(qryStr);
  console.log("passengerSearchDetail", result);
  result[0].date = await toDateFormat(result[0].date);
  return result;
};

const setMatchedDriver = async (driverRouteId, persons, date, userId) => {
  const connection = await mysql.connection();
  await connection.query("START TRANSACTION");
  const driverRoute = await query(`SELECT * FROM offered_routes WHERE route_id = ${driverRouteId}`);

  console.log("driverRoute", driverRoute);
  // const route = {
  //   origin: driverRoute[0].origin,
  //   destination: driverRoute[0].destination,
  //   persons: persons,
  //   email: email,
  //   date: date,
  //   origin_coordinate: driverRoute[0].origin_coordination,
  //   destination_coordinate: driverRoute[0].destination_coordination,
  //   passenger_type: "search"
  // };
  // console.log(route);
  const now = Math.floor(Date.now() / 1000);
  // distance update for search type passengers
  const distance = getDistanceFromLatLonInKm(driverRoute[0].origin_coordinate.x, driverRoute[0].origin_coordinate.y,
    driverRoute[0].destination_coordinate.x, driverRoute[0].destination_coordinate.y);
  const column = `(origin, destination, persons, date, origin_coordinate, destination_coordinate, 
    passenger_type, user_id, createdAt, updatedAt, distance)`;
  const setValue = `("${driverRoute[0].origin}", "${driverRoute[0].destination}", ${persons},
  UNIX_TIMESTAMP("${date}"), Point("${driverRoute[0].origin_coordinate.x}", "${driverRoute[0].origin_coordinate.y}"),
Point("${driverRoute[0].destination_coordinate.x}", "${driverRoute[0].destination_coordinate.y}"), 
"search", ${userId}, "${now}", "${now}", ${distance})`;

  const insertRouteTable = await query(`INSERT INTO requested_routes ${column} VALUES ${setValue}`);
  console.log(insertRouteTable);
  const passengerId = insertRouteTable.insertId;
  await connection.query("COMMIT");

  await connection.query("START TRANSACTION");
  const tour = {
    offered_routes_id: driverRouteId,
    passenger_routes_id: passengerId,
    finished: 0,
    passenger_type: "search"
  };
  const insertInfo = await query("INSERT INTO tour SET ?", tour);
  const updateSeats = await query(`UPDATE offered_routes SET seats_left = 
  (SELECT v2.seats_left FROM (SELECT v1.seats_left FROM offered_routes v1 WHERE route_id = ${driverRouteId}) v2) - ${persons} WHERE route_id = ${driverRouteId}`);
  const updateMatched = await query(`UPDATE requested_routes SET isMatched = 1 WHERE user_id = ${userId}`);
  await connection.query("COMMIT");
  console.log("insertInfo", insertInfo);
  console.log("insertInfo", updateSeats);
  console.log(updateMatched);
  const insertId = insertInfo.insertId;
  return insertId;
};

const getPassengerItinerary = async (email) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const qryStr = `SELECT o.origin, o.destination, FROM_UNIXTIME(o.date + 28800) AS date, o.time, o.fee, t.id, r.persons, u.name, u.picture FROM requested_routes r
  INNER JOIN tour t ON r.route_id = t.passenger_routes_id
  INNER JOIN offered_routes o ON t.offered_routes_id = o.route_id
  INNER JOIN users u ON u.id = o.user_id
  WHERE r.email = "${email}" AND UNIX_TIMESTAMP(o.routeTS) >= ${timestamp}`;
  const result = await query(qryStr);
  for (const i in result) {
    result[i].date = await toDateFormat(result[i].date);
  }
  console.log("getPassengerItinerary", result);
  return result;
};

const passengerRequestDetail = async (id) => {
  const result = await query(`SELECT origin, destination, persons, FROM_UNIXTIME(date + 28800) AS date FROM requested_routes WHERE isMatched = 0 AND user_id = ${id}`);
  for (const i in result) {
    result[i].date = await toDateFormat(result[i].date);
  }
  console.log("passengerRequestDetail", result);
  return result;
};

module.exports = {
  requestSeatsInfo,
  passengerSearch,
  passengerSearchDetail,
  setMatchedDriver,
  getPassengerItinerary,
  passengerRequestDetail
};
