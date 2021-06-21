require("dotenv").config();
const { query } = require("./mysqlcon");
const mysql = require("./mysqlcon");
const { transferToLatLng, toDateFormat, toTimestamp, getGooglePhoto, trimAddress } = require("../../util/util");
const { redisClient, getHomepageRoutes, setHomepageRoutes } = require("../../util/redis");

const insertRouteInfo = async (origin, destination, persons, date, time, id) => {
  const connection = await mysql.connection();
  try {
    await connection.query("START TRANSACTION");
    const qryStr = `SELECT * FROM offered_routes WHERE origin = "${origin}" AND destination = "${destination}" AND available_seats = "${persons}" AND date = UNIX_TIMESTAMP("${date}") AND time = "${time}" AND user_id = ${id} FOR UPDATE`;

    const checkRoute = await query(qryStr);
    // console.log("checkDuplicatedRoute", checkDuplicatedRoute);
    if (checkRoute.length > 0) {
      await connection.query("COMMIT");
      return { error: "Routes had already been created, please check your itinerary" };
    }
    const originLatLng = await transferToLatLng(origin);
    const destinationLatLng = await transferToLatLng(destination);
    console.log("originLatLng", originLatLng.lat, originLatLng.lng);
    if (!originLatLng) {
      return { error: "Couldn't find the origin. Try to type the address." };
    } else if (!destinationLatLng) {
      return { error: "Couldn't find the destination. Try to type the address." };
    }
    console.log("toTimestamp(date)", date);

    const columns = `(origin, destination, available_seats, date, time, user_id, origin_coordinate, 
      destination_coordinate, seats_left, route_timestamp)`;
    const setValue = `("${origin}", "${destination}", ${persons},
    UNIX_TIMESTAMP("${date}"), "${time}", ${id}, Point("${originLatLng.lat}", "${originLatLng.lng}"),
  Point("${destinationLatLng.lat}", "${destinationLatLng.lng}"), ${persons}, TIMESTAMP("${date}", "${time}"))`;

    const insertRoute = await query(`INSERT INTO offered_routes ${columns} VALUES ${setValue}`);
    console.log("insertRoute", insertRoute);
    if (insertRoute.length < 1) {
      return { status500: "Internal server error." };
    }
    const routId = insertRoute.insertId;
    const route = await query(`SELECT * FROM offered_routes WHERE id = ${routId}`);
    await connection.query("COMMIT");
    console.log("MAKE COMPARISON", route);
    console.log("route[0].origin_coordinate.x", route[0].origin_coordinate.x);
    return route;
  } catch (err) {
    console.log(err);
    await connection.query("ROLLBACK");
    return err;
  }
};

const getPassengerRoutesByDate = async (date) => {
  const connection = await mysql.connection();
  try {
    await connection.query("START TRANSACTION");
    const queryStr = `SELECT r.origin, r.destination, r.origin_coordinate, r.destination_coordinate, r.distance, r.persons, r.id, r.user_id, u.name, u.picture 
  FROM requested_routes r INNER JOIN users u ON r.user_id = u.id 
  WHERE date = UNIX_TIMESTAMP(?) AND matched= 0 ORDER BY distance DESC, persons DESC FOR UPDATE`;
    const allPlaces = await query(queryStr, [`${date}`]);
    await connection.query("COMMIT");
    console.log("allPlaces", allPlaces);

    return allPlaces;
  } catch (err) {
    console.log(err);
    await connection.query("ROLLBACK");
  }
};

const getDriverRouteDetail = async (id) => {
  try {
    const [routeDetail] = await query(`SELECT origin, destination, seats_left, time, origin_coordinate, destination_coordinate, FROM_UNIXTIME(date) AS date 
  FROM offered_routes WHERE id = ?`, [`${id}`]);
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
    const checkRoute = await query("SELECT id FROM offered_routes WHERE id = ? FOR UPDATE", [`${allToursArr[0][0]}`]);
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
  o.origin_coordinate, o.destination_coordinate, u.name, u.picture, u.id AS userId, o.id AS routeId FROM offered_routes o 
  INNER JOIN users u ON o.user_id = u.id WHERE o.id = ? AND UNIX_TIMESTAMP(route_timestamp) >= ${timestamp}`, [routeId]);
    console.log("DriversItinerary", driverInfo);
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
    console.log(timestamp);
    const matchQryStr = `SELECT o.origin, o.destination, FROM_UNIXTIME(o.date) AS date, o.seats_left, o.time, o.id, t.id AS tourId
  FROM offered_routes o INNER JOIN tour t ON o.id = t.offered_routes_id 
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
  FROM offered_routes o LEFT OUTER JOIN tour t ON o.id = t.offered_routes_id 
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
    for (const id of passengerRouteId) {
      console.log("driverRouteId, passengerRouteId", typeof (driverRouteId), typeof (id));
      const checkTour = await query(`SELECT * FROM tour WHERE offered_routes_id = ${driverRouteId} 
      AND passenger_routes_id = ${id} FOR UPDATE`);
      if (checkTour.length > 0) {
        return { error: "Tour had already been created, please check your itinerary" };
      }
      const routeInfo = [driverRouteId, id, "request", 0, 0, userId];
      insertArr.push(routeInfo);
    }
    const tour = await query("INSERT INTO tour (offered_routes_id, passenger_routes_id, passenger_type, finished, match_status, send_by) VALUES ?", [insertArr]);
    console.log("-------", tour);
    const insertId = tour.insertId;
    await connection.query("COMMIT");
    return insertId;
  } catch (err) {
    console.log(err);
    await connection.query("ROLLBACK");
  }
};

const saveWaypts = async (getCity, routeId) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const column = "(offered_routes_id, coordinate, city, created_at)";
    for (const i in getCity) {
      const value = `(${routeId}, Point("${getCity[i].lat}", "${getCity[i].lng}"), "${getCity[i].city}", ${timestamp})`;
      const result = await query(`INSERT INTO routes_waypoints ${column} VALUES ${value}`);
    }
    return routeId;
  } catch (err) {
    console.log(err);
  }
};

const getDriverHomepage = async () => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const routes = await query(`SELECT origin, destination, FROM_UNIXTIME(date) AS date, seats_left, id
    FROM offered_routes WHERE date > ${timestamp} AND seats_left > 0 ORDER BY date LIMIT 4`);
    console.log(routes);
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
    console.log(routes);
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
  o.seats_left, o.user_id, o.id AS routeId, u.name, u.picture, t.match_status, t.send_by, o.origin_coordinate, o.destination_coordinate
  FROM tour t INNER JOIN offered_routes o ON t.offered_routes_id = o.id 
  INNER JOIN users u ON o.user_id = u.id WHERE t.id = ${tourId}`);
    if (driverInfo.length < 1) {
      return { error: "route or tour are not existed" };
    }
    driverInfo[0].date = await toDateFormat(driverInfo[0].date);
    console.log("driverInfo", driverInfo);

    const passengerInfo = await query(`SELECT r.id AS routeId, r.origin, r.destination, r.persons, 
  FROM_UNIXTIME(r.date) AS date, u.id AS userId, u.name, u.picture, t.match_status, r.origin_coordinate, r.destination_coordinate FROM tour t
  INNER JOIN requested_routes r ON t.passenger_routes_id = r.id
  INNER JOIN users u ON r.user_id = u.id 
  INNER JOIN offered_routes o ON t.offered_routes_id = o.id WHERE o.id = ${driverInfo[0].routeId}`);
    if (driverInfo.length < 1) {
      return { error: "route or tour are not existed" };
    }
    passengerInfo[0].date = await toDateFormat(passengerInfo[0].date);
    console.log("passengerInfo", passengerInfo);

    const result = {};
    result.driverInfo = driverInfo[0];
    result.passengerInfo = passengerInfo;
    result.tourInfo = { tourId: tourId, matchStatus: driverInfo[0].match_status, sendBy: driverInfo[0].send_by };
    console.log("getTourInfo Model:", result);
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
    console.log("selectDriverRoute", driverRoute);
    return driverRoute;
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  insertRouteInfo,
  getPassengerRoutesByDate,
  getDriverRouteDetail,
  setMatchedPassengers,
  getDriverItineraryDetail,
  getDriverItinerary,
  setDriverTour,
  saveWaypts,
  getDriverHomepage,
  getTourInfo,
  selectDriverRoute
};
