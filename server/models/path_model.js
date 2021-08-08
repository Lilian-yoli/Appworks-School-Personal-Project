require("dotenv").config();
const { query } = require("./mysqlcon");
const mysql = require("./mysqlcon");
const { transferToLatLng, toDateFormat, toTimestamp, getGooglePhoto, trimAddress } = require("../../util/util");
const { redisClient, getHomepageRoutes, setHomepageRoutes, addLocations, removeSet, set } = require("../../util/redis");
const geo = require("georedis").initialize(redisClient);
const schedule = require("node-schedule");

const insertRouteInfo = async (origin, destination, persons, date, time, id) => {
  const connection = await mysql.connection();
  try {
    await connection.query("START TRANSACTION");
    const qryStr = `SELECT * FROM offered_routes2 WHERE origin = "${origin}" AND destination = "${destination}" AND available_seats = "${persons}" AND date = UNIX_TIMESTAMP("${date}") AND time = "${time}" AND user_id = ${id} FOR UPDATE`;

    const checkRoute = await query(qryStr);
    if (checkRoute.length > 0) {
      await connection.query("COMMIT");
      return { error: "Routes had already been created, please check your itinerary" };
    }
    const originLatLng = await transferToLatLng(origin);
    const destinationLatLng = await transferToLatLng(destination);
    if (!originLatLng) {
      return { error: "Couldn't find the origin. Try to type the address." };
    } else if (!destinationLatLng) {
      return { error: "Couldn't find the destination. Try to type the address." };
    }
    console.log("date", date);
    // const columns = `(origin, destination, available_seats, date, time, user_id, origin_latitude, origin_longitude,
    //   destination_latitude, destination_longitude, seats_left, route_timestamp)`;
    const timestamp = await toTimestamp(date);
    const routeToDB = {
      origin: origin,
      destination: destination,
      available_seats: persons,
      date: timestamp,
      time: time,
      user_id: id,
      origin_latitude: originLatLng.lat,
      origin_longitude: originLatLng.lng,
      destination_latitude: destinationLatLng.lat,
      destination_longitude: destinationLatLng.lng,
      seats_left: persons,
      route_timestamp: `${date} ${time}`
    };
    //   const setValue = `("${origin}", "${destination}", ${persons},
    //   UNIX_TIMESTAMP("${date}"), "${time}", ${id}, Point("${originLatLng.lat}", "${originLatLng.lng}"),
    // Point("${destinationLatLng.lat}", "${destinationLatLng.lng}"), ${persons}, TIMESTAMP("${date}", "${time}"))`;

    const insertRoute = await query("INSERT INTO offered_routes2 SET ?", routeToDB);
    if (insertRoute.length < 1) {
      return null;
    }
    routeToDB.id = insertRoute.insertId;
    // const route = await query(`SELECT * FROM offered_routes WHERE id = ${routId}`);
    await connection.query("COMMIT");
    return routeToDB;
  } catch (err) {
    console.log(err);
    await connection.query("ROLLBACK");
    return null;
  }
};

const getPassengerRoutes = async (timestamp, routesId) => {
  const connection = await mysql.connection();
  try {
    console.log("date, routesId", timestamp, routesId);
    await connection.query("START TRANSACTION");
    const queryStr = `SELECT r.origin, r.destination, r.origin_latitude, r.origin_longitude, r.destination_latitude, r.destination_longitude, r.distance, r.persons, r.id, r.user_id, u.name, u.picture 
  FROM requested_routes2 r INNER JOIN users u ON r.user_id = u.id 
  WHERE r.date = ${timestamp} AND r.matched= 0 AND r.id in (?) ORDER BY distance DESC, persons DESC FOR UPDATE`;
    const allPlaces = await query(queryStr, [routesId]);
    await connection.query("COMMIT");

    return allPlaces;
  } catch (err) {
    console.log(err);
    await connection.query("ROLLBACK");
  }
};

const getDriverRouteDetail = async (id) => {
  try {
    const [routeDetail] = await query(`SELECT origin, destination, seats_left, time, origin_latitude, origin_longitude, destination_latitude, destination_longitude, FROM_UNIXTIME(date) AS date, date AS timestamp 
  FROM offered_routes2 WHERE id = ?`, [`${id}`]);
    if (!routeDetail) {
      return { error: "No such route offered" };
    }
    routeDetail.date = await toDateFormat(routeDetail.date);
    return routeDetail;
  } catch (err) {
    console.log(err);
  }
};

const setMatchedPassengers = async (allToursArr, personsCounter) => {
  const connection = await mysql.connection();
  try {
    await connection.query("START TRANSACTION");
    const checkRoute = await query("SELECT id FROM offered_routes2 WHERE id = ? FOR UPDATE", [`${allToursArr[0][0]}`]);
    if (checkRoute.lenth > 1) {
      return null;
    }
    // 1. insert info to tour table
    const insertId = await connection.query("INSERT INTO tour (offered_routes_id, passenger_routes_id, passenger_type, finished) VALUES ? ", [allToursArr]);
    // 2. update seats to offered_routes table
    const updateSeats = await query(`UPDATE offered_routes2 SET seats_left =
    (SELECT v2.seats_left FROM (SELECT v1.seats_left FROM offered_routes2 v1 WHERE id = ${allToursArr[0][0]}) v2) - ${personsCounter} WHERE id = ${allToursArr[0][0]}`);
    await connection.query("COMMIT");
    // 3. update offered_route_id to requested_routes table
    const updateRequestedRoutes = await query(`UPDATE requested_routes2 SET isMatched = 1 WHERE id IN
    (SELECT passenger_routes_id FROM tour WHERE offered_routes_id = ${allToursArr[0][0]})`);
    // 4. select passenger_email return
    const result = await query(`SELECT passenger_routes_id FROM tour WHERE offered_routes_id = ${allToursArr[0][0]}`);
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
  o.origin_latitude, o.origin_longitude, o.destination_latitude, o.destination_longitude, u.name, u.picture, u.id AS userId, o.id AS routeId FROM offered_routes2 o 
  INNER JOIN users u ON o.user_id = u.id WHERE o.id = ? AND UNIX_TIMESTAMP(route_timestamp) >= ${timestamp}`, [routeId]);
    if (driverInfo.length < 1) {
      return { error: "Route is not existed, redirect to home page" };
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
    const matchQryStr = `SELECT o.origin, o.destination, FROM_UNIXTIME(o.date) AS date, o.seats_left, o.time, o.id, t.id AS tourId
  FROM offered_routes2 o INNER JOIN tour t ON o.id = t.offered_routes_id 
  WHERE user_id = ${id} AND UNIX_TIMESTAMP(route_timestamp) >= ${timestamp} ORDER BY route_timestamp`;
    let match = await query(matchQryStr);
    if (match.length < 1) {
      match = { empty: "行程尚未媒合" };
    } else {
      for (const i in match) {
        match[i].date = await toDateFormat(match[i].date);
      }
    }
    const unmatchQryStr = `SELECT o.origin, o.destination, FROM_UNIXTIME(o.date) AS date, o.seats_left, o.time, o.id
  FROM offered_routes2 o LEFT OUTER JOIN tour t ON o.id = t.offered_routes_id 
  WHERE user_id = ${id} AND UNIX_TIMESTAMP(route_timestamp) >= ${timestamp} AND t.id IS NULL ORDER BY route_timestamp`;
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

const setDriverTour = async (driverRouteId, passengerRouteId, userId) => {
  const connection = await mysql.connection();
  try {
    await connection.query("START TRANSACTION");
    const insertArr = [];
    console.log("passengerRouteId", passengerRouteId);
    for (const id of passengerRouteId) {
      const checkTour = await query(`SELECT * FROM tour WHERE offered_routes_id = ${driverRouteId} 
      AND passenger_routes_id = ${id} FOR UPDATE`);
      if (checkTour.length > 0) {
        return { error: "Tour had already been created, please check your itinerary" };
      }
      const routeInfo = [driverRouteId, id, "request", 0, 0, userId];
      insertArr.push(routeInfo);
    }
    const tour = await query("INSERT INTO tour (offered_routes_id, passenger_routes_id, passenger_type, finished, match_status, send_by) VALUES ?", [insertArr]);
    const insertId = tour.insertId;
    await connection.query("COMMIT");
    return insertId;
  } catch (err) {
    console.log(err);
    await connection.query("ROLLBACK");
  }
};

const saveWaypts = async (date, waypoints, routeId) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const queryStr = `INSERT INTO routes_waypoints2 (offered_routes_id, latitude, longitude, created_at)
      VALUES ?`;
    const waypointsToDB = [];
    for (const waypoint of waypoints) {
      const waypointToDB = [routeId, waypoint.lat, waypoint.lng, timestamp];
      waypointsToDB.push(waypointToDB);
    }
    console.log("waypointsToDB", waypointsToDB);
    const result = await query(queryStr, [waypointsToDB]);
    console.log("result", result);
    const redisSet = await getAllWayptsToRedis(date, routeId);
    return redisSet;
  } catch (err) {
    console.log(err);
  }
};

const getAllWayptsToRedis = async (date, routeId) => {
  const wayptsLocationsName = [];
  console.log("getAllWayptsToRedis DATE", date);
  const allWaypoints = await query(`SELECT r.latitude, r.longitude, r.id, o.id AS routeId FROM routes_waypoints2 r 
      INNER JOIN offered_routes2 o ON r.offered_routes_id = o.id
      WHERE o.date = ${date}`);
  const waypointsSet = {};

  console.log("allWaypoints", allWaypoints);
  for (const waypoint of allWaypoints) {
    console.log("FORLOOP waypoint", waypoint);
    waypointsSet[`${waypoint.id}/${waypoint.routeId}`] = { latitude: waypoint.latitude, longitude: waypoint.longitude };
    if (routeId) {
      if (waypoint.routeId == routeId) {
        wayptsLocationsName.push(`${waypoint.id}/${waypoint.routeId}`);
      }
    }
  }
  if (routeId) {
    setHomepageRoutes("wayptsLocationsName", wayptsLocationsName, 7200);
  }
  console.log("waypointsSet", waypointsSet);
  console.log("waypoints IF", (JSON.stringify(waypointsSet) != "{}"));
  if (JSON.stringify(waypointsSet) != "{}") {
    await removeSet("driverWaypoints");
    const driverWaypoints = geo.addSet("driverWaypoints");
    const redisSet = await addLocations(driverWaypoints, waypointsSet);
    console.log("redisSet", redisSet);
    return waypointsSet;
  } else {
    return null;
  }
};

const getDriverHomepage = async () => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const routes = await query(`SELECT origin, destination, FROM_UNIXTIME(date) AS date, seats_left, id
    FROM offered_routes2 WHERE date > ${timestamp} AND seats_left > 0 ORDER BY date LIMIT 4`);
    if (routes.length < 0) {
      return { error: "interanal server error" };
    }
    // if redis existed get from redis
    const routesFromRedis = await getHomepageRoutes("driverRoute", routes);
    if (routesFromRedis) {
      return { routes: routesFromRedis };
    }
    for (const route of routes) {
      route.date = await toDateFormat(route.date);
      route.photo = await getGooglePhoto(route.destination);
      route.origin = await trimAddress(route.origin);
      route.destination = await trimAddress(route.destination);
    }
    const setRouteToRedis = setHomepageRoutes("driverRoute", routes);
    return { routes };
  } catch (error) {
    console.log(error);
  }
};

const getTourInfo = async (tourId) => {
  const connection = await mysql.connection();
  try {
    await connection.query("START TRANSACTION");
    const driverInfo = await query(`SELECT o.origin, o.destination, FROM_UNIXTIME(o.date) AS date, o.time,
  o.seats_left, o.user_id AS userId, o.id AS routeId, u.name, u.picture, t.match_status, t.send_by, o.origin_latitude, o.origin_longitude, o.destination_latitude, o.destination_longitude
  FROM tour t INNER JOIN offered_routes2 o ON t.offered_routes_id = o.id 
  INNER JOIN users u ON o.user_id = u.id WHERE t.id = ${tourId}`);
    if (driverInfo.length < 1) {
      return { error: "route or tour are not existed" };
    }
    driverInfo[0].date = await toDateFormat(driverInfo[0].date);

    const passengerInfo = await query(`SELECT r.id AS routeId, r.origin, r.destination, r.persons, 
  FROM_UNIXTIME(r.date) AS date, u.id AS userId, u.name, u.picture, t.match_status, r.origin_latitude, r.origin_longitude, r.destination_latitude, r.destination_longitude, t.send_by FROM tour t
  INNER JOIN requested_routes2 r ON t.passenger_routes_id = r.id
  INNER JOIN users u ON r.user_id = u.id 
  INNER JOIN offered_routes2 o ON t.offered_routes_id = o.id WHERE o.id = ${driverInfo[0].routeId}`);
    if (driverInfo.length < 1) {
      return { error: "route or tour are not existed" };
    }
    passengerInfo[0].date = await toDateFormat(passengerInfo[0].date);

    const result = {};
    result.driverInfo = driverInfo[0];
    result.passengerInfo = passengerInfo;
    result.tourInfo = { tourId: tourId, matchStatus: driverInfo[0].match_status, sendBy: driverInfo[0].send_by };
    return result;
  } catch (err) {
    console.log(err);
  }
};

const selectDriverRoute = async (date, persons, id) => {
  try {
    const driverRoute = await query(`SELECT origin, destination, time, id FROM offered_routes
  WHERE date = UNIX_TIMESTAMP("${date}") AND user_id = ? AND seats_left >= ${persons}`, [id]);
    if (driverRoute.length < 1) {
      return { error: "Route is not matched." };
    }
    return driverRoute;
  } catch (err) {
    console.log(err);
  }
};

const updateDriverWaypts = async () => {
  await getAllWayptsToRedis(null);
  const rule = new schedule.RecurrenceRule();
  rule.dayOfWeek = [0, new schedule.Range(1, 6)];
  rule.hour = 0;
  rule.minute = 0;
  const job = schedule.scheduleJob(rule, async () => {
    await getAllWayptsToRedis(null);
    const now = new Date();
    console.log(`reset driverWaypoints at ${now}`);
  });
};

module.exports = {
  insertRouteInfo,
  getPassengerRoutes,
  getDriverRouteDetail,
  setMatchedPassengers,
  getDriverItineraryDetail,
  getDriverItinerary,
  setDriverTour,
  saveWaypts,
  getDriverHomepage,
  getTourInfo,
  selectDriverRoute,
  getAllWayptsToRedis
};
