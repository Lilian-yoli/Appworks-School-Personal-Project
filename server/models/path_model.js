require("dotenv").config();
const { query } = require("./mysqlcon");
const mysql = require("./mysqlcon");
const { transferToLatLng, toDateFormat, toTimestamp, getGooglePhoto, trimAddress } = require("../../util/util");

const insertRouteInfo = async (origin, destination, persons, date, time, id) => {
  const connection = await mysql.connection();
  await connection.query("START TRANSACTION");
  const qryStr = `SELECT * FROM offered_routes WHERE origin = "${origin}" AND destination = "${destination}" AND available_seats = "${persons}" AND date = UNIX_TIMESTAMP("${date}") AND time = "${time}" AND user_id = ${id} FOR UPDATE`;

  const checkDuplicatedRoute = await query(qryStr);
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

  const columns = `(origin, destination, available_seats, date, time, user_id, origin_coordinate, 
      destination_coordinate, seats_left, routeTS)`;
  const setValue = `("${origin}", "${destination}", ${persons},
    UNIX_TIMESTAMP("${date}"), "${time}", ${id}, Point("${originLatLng.lat}", "${originLatLng.lng}"),
  Point("${destinationLatLng.lat}", "${destinationLatLng.lng}"), ${persons}, TIMESTAMP("${date}", "${time}"))`;

  const insertRoute = await query(`INSERT INTO offered_routes ${columns} VALUES ${setValue}`);
  console.log("insertRoute", insertRoute);
  const routId = insertRoute.insertId;
  const route = await query(`SELECT * FROM offered_routes WHERE id = ${routId}`);
  await connection.query("COMMIT");
  console.log("MAKE COMPARISON", route);
  console.log("route[0].origin_coordinate.x", route[0].origin_coordinate.x);
  return { route };
};

const getAllplacesByPassengers = async (date) => {
  const connection = await mysql.connection();
  await connection.query("START TRANSACTION");
  const queryStr = `SELECT r.origin, r.destination, r.origin_coordinate, r.destination_coordinate, r.distance, r.persons, r.id, r.user_id, u.name, u.picture 
  FROM requested_routes r INNER JOIN users u ON r.user_id = u.id 
  WHERE date = UNIX_TIMESTAMP("${date}") AND isMatched= 0 ORDER BY distance DESC, persons DESC FOR UPDATE`;
  const allPlaces = await query(queryStr);
  await connection.query("COMMIT");
  console.log("allPlaces", allPlaces);

  return allPlaces;
};

const getDriverDetail = async (id) => {
  const driverDetail = await query(`SELECT origin, destination, seats_left, time, origin_coordinate, destination_coordinate, FROM_UNIXTIME(date) AS date 
  FROM offered_routes WHERE id = ${id}`);
  if (!driverDetail) {
    return { error: "No such route offered" };
  }
  driverDetail[0].date = await toDateFormat(driverDetail[0].date);
  return driverDetail[0];
};

const setMatchedPassengers = async (allToursArr, personsCounter) => {
  const connection = await mysql.connection();
  try {
    await connection.query("START TRANSACTION");
    const checkRoute = await query(`SELECT id FROM offered_routes WHERE id = ${allToursArr[0][0]} FOR UPDATE`);
    if (checkRoute.lenth > 1) {
      return null;
    }
    // 1. insert info to tour table
    const insertId = await connection.query("INSERT INTO tour (offered_routes_id, passenger_routes_id, passenger_type, finished) VALUES ? ", [allToursArr]);
    // 2. update seats to offered_routes table
    const updateSeats = await query(`UPDATE offered_routes SET seats_left =
    (SELECT v2.seats_left FROM (SELECT v1.seats_left FROM offered_routes v1 WHERE id = ${allToursArr[0][0]}) v2) - ${personsCounter} WHERE id = ${allToursArr[0][0]}`);
    await connection.query("COMMIT");
    // 3. update offered_route_id to requested_routes table
    const updateRequestedRoutes = await query(`UPDATE requested_routes SET isMatched = 1 WHERE id IN
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

const getDriverItineraryDetail = async (routeId, user) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const driverInfo = await query(`SELECT o.origin, o.destination, FROM_UNIXTIME(o.date + 28800) AS date, o.time, o.seats_left, 
  o.origin_coordinate, o.destination_coordinate, u.name, u.picture, u.id, o.id FROM offered_routes o 
  INNER JOIN users u ON o.user_id = u.id WHERE o.id = ${routeId} AND UNIX_TIMESTAMP(routeTS) >= ${timestamp}`);
    console.log("DriversItinerary", driverInfo);
    if (driverInfo.length < 1) {
      return { error: "Route is not existed" };
    }
    const userInfo = await query("SELECT id FROM users WHERE email = ?", [user.email]);
    driverInfo[0].date = await toDateFormat(driverInfo[0].date);
    const result = { driverInfo, userInfo };
    return result;
  } catch (err) {
    console.log(err);
  }
};

const getDriverItinerary = async (id) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    console.log(timestamp);
    const matchQryStr = `SELECT o.origin, o.destination, FROM_UNIXTIME(o.date) AS date, o.seats_left, o.time, o.id, t.id AS tourId
  FROM offered_routes o INNER JOIN tour t ON o.id = t.offered_routes_id 
  WHERE user_id = ${id} AND UNIX_TIMESTAMP(routeTS) >= ${timestamp} ORDER BY routeTS`;
    let match = await query(matchQryStr);
    if (match.length < 1) {
      match = { empty: "行程尚未媒合" };
    } else {
      for (const i in match) {
        match[i].date = await toDateFormat(match[i].date);
      }
    }
    const unmatchQryStr = `SELECT o.origin, o.destination, FROM_UNIXTIME(o.date) AS date, o.seats_left, o.time, o.id
  FROM offered_routes o LEFT OUTER JOIN tour t ON o.id = t.offered_routes_id 
  WHERE user_id = ${id} AND UNIX_TIMESTAMP(routeTS) >= ${timestamp} AND t.id IS NULL ORDER BY routeTS`;
    let unmatch = await query(unmatchQryStr);
    if (unmatch.length < 1) {
      unmatch = { empty: "尚未提供行程" };
    } else {
      for (const i in unmatch) {
        unmatch[i].date = await toDateFormat(unmatch[i].date);
      }
    }
    const result = { match, unmatch };
    return result;
  } catch (err) {
    console.error(err);
  }
};

const driverSearch = async (origin, destination, date) => {
  console.log(234);
  const qryStr = `SELECT origin, destination, FROM_UNIXTIME(date + 28800) AS date, persons, id FROM requested_routes 
  WHERE origin like"%${origin}%" AND destination like "%${destination}%" AND date = UNIX_TIMESTAMP("${date}") AND isMatched = 0`;
  const result = await query(qryStr);
  for (const i in result) {
    result[i].date = await toDateFormat(result[i].date);
  }
  console.log("driverSearch", result);
  if (result.length < 1) {
    return null;
  } else {
    return result;
  }
};

const driverSearchDetail = async (id) => {
  console.log(id);
  const qryStr = `SELECT r.origin, r.destination, FROM_UNIXTIME(r.date + 28800) AS date, r.persons, r.id, u.name, u.picture, u.id 
  FROM requested_routes r INNER JOIN users u ON r.user_id = u.id WHERE r.id = ${id}`;
  const result = await query(qryStr);
  console.log("passengerSearchDetail", result);
  result[0].date = await toDateFormat(result[0].date);
  return result;
};

const setDriverTour = async (driverRouteId, passengerRouteId, userId) => {
  const connection = await mysql.connection();
  await connection.query("START TRANSACTION");

  const insertArr = [];
  for (const i in passengerRouteId) {
    console.log("driverRouteId, passengerRouteId", typeof (driverRouteId), typeof (passengerRouteId[i]));
    const checkTour = await query(`SELECT * FROM tour 
  WHERE offered_routes_id = ${driverRouteId} AND passenger_routes_id = ${passengerRouteId[i]} FOR UPDATE`);
    console.log("**************", checkTour);
    if (checkTour.length > 0) {
      return { error: "Tour had already been created, please check your itinerary" };
    }
    const routeInfo = [driverRouteId, passengerRouteId[i], "request", 0, 0, userId];
    insertArr.push(routeInfo);
  }
  const result = await query("INSERT INTO tour (offered_routes_id, passenger_routes_id, passenger_type, finished, match_status, send_by) VALUES ?", [insertArr]);
  console.log("-------", result);
  const insertId = result.insertId;
  await connection.query("COMMIT");
  return insertId;
};

const saveWaypts = async (getCity, routeId) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const column = "(offered_routes_id, coordinate, city, createdAt)";
  for (const i in getCity) {
    const value = `(${routeId}, Point("${getCity[i].lat}", "${getCity[i].lng}"), "${getCity[i].city}", ${timestamp})`;
    const result = await query(`INSERT INTO routes_waypoints ${column} VALUES ${value}`);
  }
  return routeId;
};

const getDriverHomepage = async () => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const route = await query(`SELECT origin, destination, FROM_UNIXTIME(date + 28800) AS date, seats_left, id
    FROM offered_routes WHERE date > ${timestamp} AND seats_left > 0 ORDER BY date LIMIT 4`);
    console.log(route);
    for (const i in route) {
      route[i].date = await toDateFormat(route[i].date);
      route[i].photo = await getGooglePhoto(route[i].destination);
      route[i].origin = await trimAddress(route[i].origin);
      route[i].destination = await trimAddress(route[i].destination);
    }
    console.log(route);
    return { route };
  } catch (error) {
    console.log(error);
  }
};

const getTourInfo = async (tourId) => {
  const connection = await mysql.connection();
  await connection.query("START TRANSACTION");
  const driverInfo = await query(`SELECT o.origin, o.destination, FROM_UNIXTIME(o.date + 28800) AS date, o.time,
  o.seats_left, o.user_id, o.id, u.id, u.name, u.picture, t.match_status, t.send_by, o.origin_coordinate, o.destination_coordinate
  FROM tour t INNER JOIN offered_routes o ON t.offered_routes_id = o.id 
  INNER JOIN users u ON o.user_id = u.id WHERE t.id = ${tourId}`);
  driverInfo[0].date = await toDateFormat(driverInfo[0].date);
  console.log("driverInfo", driverInfo);

  const passengerInfo = await query(`SELECT r.id, r.origin, r.destination, r.persons, 
  FROM_UNIXTIME(r.date + 28800) AS date, u.id, u.name, u.picture, t.match_status, r.origin_coordinate, r.destination_coordinate FROM tour t
  INNER JOIN requested_routes r ON t.passenger_routes_id = r.id
  INNER JOIN users u ON r.user_id = u.id 
  INNER JOIN offered_routes o ON t.offered_routes_id = o.id WHERE o.id = ${driverInfo[0].id}`);
  passengerInfo[0].date = await toDateFormat(passengerInfo[0].date);
  console.log("passengerInfo", passengerInfo);

  const result = {};
  result.driverInfo = driverInfo[0];
  result.passengerInfo = passengerInfo;
  result.tourInfo = { tourId: tourId, matchStatus: driverInfo[0].match_status, sendBy: driverInfo[0].send_by };
  console.log("getTourInfo Model:", result);
  return result;
};

const selectDriverRoute = async (date, persons, id) => {
  try {
    console.log(123);
    const driverRoute = await query(`SELECT origin, destination, time, id FROM offered_routes
  WHERE date = UNIX_TIMESTAMP("${date}") AND user_id = ? AND seats_left >= ${persons}`, [id]);
    if (driverRoute.length < 1) {
      console.log(456);
      return { error: "Route is not matched." };
    }
    console.log("selectDriverRoute", driverRoute);
    return driverRoute;
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  insertRouteInfo,
  getAllplacesByPassengers,
  getDriverDetail,
  setMatchedPassengers,
  getDriverItineraryDetail,
  getDriverItinerary,
  driverSearch,
  driverSearchDetail,
  setDriverTour,
  saveWaypts,
  getDriverHomepage,
  getTourInfo,
  selectDriverRoute
};
