require("dotenv").config();
const { query } = require("./mysqlcon");
const mysql = require("./mysqlcon");
const { transferToLatLng, toDateFormat, toTimestamp } = require("../../util/util");

const insertRouteInfo = async (origin, destination, persons, date, time, email, fee, mySQLTable) => {
  const connection = await mysql.connection();
  await connection.query("START TRANSACTION");
  let queryStr;
  if (mySQLTable === "requested_routes") {
    queryStr = `SELECT * FROM ${mySQLTable} WHERE origin = "${origin}" AND destination = "${destination}" AND persons = "${persons}" AND date = "${date}" AND email = "${email}" FOR UPDATE`;
  } else if (mySQLTable === "offered_routes") {
    queryStr = `SELECT * FROM ${mySQLTable} WHERE origin = "${origin}" AND destination = "${destination}" AND available_seats = "${persons}" AND date = "${date}" AND time = "${time}" AND driver_email = "${email}" FOR UPDATE`;
  }
  const checkDuplicatedRoute = await query(queryStr);
  // console.log("checkDuplicatedRoute", checkDuplicatedRoute);
  if (checkDuplicatedRoute.length > 0) {
    await connection.query("COMMIT");
    return { error: "Routes had already been created, please check your itinerary" };
  }
  const originLatLng = await transferToLatLng(origin);
  const destinationLatLng = await transferToLatLng(destination);
  console.log("originLatLng", originLatLng.lat, originLatLng.lng);
  if (!originLatLng || !destinationLatLng) {
    return { error: "Couldn't find the origin. Try to type the address." };
  } else if (!destinationLatLng) {
    return { error: "Couldn't find the destination. Try to type the address." };
  }
  console.log("toTimestamp(date)", date);

  let columns, setValue;
  if (mySQLTable === "requested_routes") {
    columns = `(origin, destination, persons, date, email, origin_coordinate, 
      destination_coordinate, passenger_type, offered_routes_id)`;
    setValue = `("${origin}", "${destination}", "${persons}",
    UNIX_TIMESTAMP("${date}"), "${email}", Point("${originLatLng.lat}", "${originLatLng.lng}"),
  Point("${destinationLatLng.lat}", "${destinationLatLng.lng}"), "request", 0)`;
  } else if (mySQLTable === "offered_routes") {
    columns = `(origin, destination, available_seats, date, time, driver_email, origin_coordinate, 
      destination_coordinate, fee, requested_routes_id, seats_left, routeTS)`;
    setValue = `("${origin}", "${destination}", ${persons},
    UNIX_TIMESTAMP("${date}"), "${time}", "${email}", Point("${originLatLng.lat}", "${originLatLng.lng}"),
  Point("${destinationLatLng.lat}", "${destinationLatLng.lng}"), "${fee}", 0, ${persons}, TIMESTAMP("${date}", "${time}"))`;
  }

  const insertRoute = await query(`INSERT INTO ${mySQLTable} ${columns} VALUES ${setValue}`);
  console.log("insertRoute", insertRoute);
  const id = insertRoute.insertId;
  const route = await query(`SELECT * FROM ${mySQLTable} WHERE route_id = ${id}`);
  await connection.query("COMMIT");
  console.log("MAKE COMPARISON", route);
  console.log("route[0].origin_coordinate.x", route[0].origin_coordinate.x);
  return { route };
};

const getAllplacesByPassengers = async (date) => {
  const connection = await mysql.connection();
  await connection.query("START TRANSACTION");
  const queryStr = `SELECT * FROM requested_routes WHERE date = "${date}" AND offered_routes_id = 0 FOR UPDATE`;
  const allPlaces = await query(queryStr);
  await connection.query("COMMIT");
  console.log(allPlaces);

  return allPlaces;
};

const getDriverDetail = async (id) => {
  const driverDetail = await query(`SELECT * FROM offered_routes WHERE route_id = ${id}`);
  if (!driverDetail) {
    return { error: "No such route offered" };
  }
  return driverDetail[0];
};

const setMatchedPassengers = async (allToursArr, personsCounter) => {
  const connection = await mysql.connection();
  try {
    await connection.query("START TRANSACTION");
    // 1. insert info to tour table
    const insertId = await connection.query("INSERT INTO tour (offered_routes_id, passenger_routes_id, passenger_type, finished) VALUES ? ", [allToursArr]);
    // 2. update seats to offered_routes table
    const updateSeats = await query(`UPDATE offered_routes SET seats_left =
    (SELECT v2.seats_left FROM (SELECT v1.seats_left FROM offered_routes v1 WHERE route_id = ${allToursArr[0][0]}) v2) - ${personsCounter} WHERE route_id = ${allToursArr[0][0]}`);
    await connection.query("COMMIT");
    // 3. update offered_route_id to requested_routes table
    const updateRequestedRoutes = await query(`UPDATE requested_routes SET offered_routes_id = ${allToursArr[0][0]} WHERE route_id IN
    (SELECT passenger_routes_id FROM tour WHERE offered_routes_id = ${allToursArr[0][0]})`);
    // 4. select passenger_email return
    const result = await query(`SELECT passenger_routes_id FROM tour WHERE offered_routes_id = ${allToursArr[0][0]}`);
    console.log(updateSeats);
    console.log("updateRequestedRoutes", updateRequestedRoutes);
    return result;
  } catch (error) {
    await connection.query("ROLLBACK");
    return { error: error };
  }
};

const getDriverItineraryDetail = async (id) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const driverInfo = await query(`SELECT origin, destination, FROM_UNIXTIME(date) AS date, time, available_seats FROM offered_routes WHERE route_id = ${id} AND UNIX_TIMESTAMP(routeTS) >= ${timestamp}`);
  console.log("DriversItinerary", driverInfo);
  if (driverInfo.length < 1) {
    return { error: "Itnerary is in the past" };
  }
  driverInfo[0].date = await toDateFormat(driverInfo[0].date);
  const passengerInfo = await query(`SELECT passenger_routes_id FROM tour WHERE offered_routes_id = ${id} GROUP BY passenger_routes_id`);
  console.log(passengerInfo);
  const passengerInfoArr = [];
  if (passengerInfo.length > 0) {
    for (const i in passengerInfo) {
      const qryStr = `SELECT u.name, u.email, u.phone, u.picture, r.route_id, r.persons FROM requested_routes r 
      INNER JOIN users u ON r.email = u.email 
      WHERE route_id = ${passengerInfo[i].passenger_routes_id}`;
      const result = await query(qryStr);
      passengerInfoArr.push(result[0]);
    }
  }
  const driverItineraryDetail = { driversInfo: driverInfo[0], passengerInfoArr: passengerInfoArr };
  return driverItineraryDetail;
};

const getDriverItinerary = async (email) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const qryStr = `SELECT origin, destination, FROM_UNIXTIME(date) AS date, available_seats, fee, time, route_id FROM offered_routes WHERE driver_email = "${email}" AND UNIX_TIMESTAMP(routeTS) >= ${timestamp}`;
  const result = await query(qryStr);
  for (const i in result) {
    result[i].date = await toDateFormat(result[i].date);
  }
  return result;
};

module.exports = {
  insertRouteInfo,
  getAllplacesByPassengers,
  getDriverDetail,
  setMatchedPassengers,
  getDriverItineraryDetail,
  getDriverItinerary
};
