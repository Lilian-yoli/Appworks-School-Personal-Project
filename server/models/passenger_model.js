// eslint-disable-next-line no-unused-vars
const { query } = require("./mysqlcon");
const mysql = require("./mysqlcon");
const { toDateFormat, toTimestamp, transferToLatLng, getDistanceFromLatLonInKm, getCity, getShortestRoute, orderShortestRoute } = require("../../util/util");

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
  Point("${destinationLatLng.lat}", "${destinationLatLng.lng}"), "request", 0, "${now}", "${now}", ${distance})`;

  const insertRoute = await query(`INSERT INTO requested_routes ${columns} VALUES ${setValue}`);
  console.log("insertRoute", insertRoute);
  const routeId = insertRoute.insertId;
  const route = await query(`SELECT * FROM requested_routes WHERE route_id = ${routeId}`);

  const originCity = await getCity(originLatLng);
  const destinationCity = await getCity(destinationLatLng);
  const city = [[routeId, originCity, "origin", now], [routeId, destinationCity, "destination", now]];
  const insertCity = await query(`INSERT INTO requested_routes_cities 
  (requested_routes_id, city, coordinate_type, created_at) VALUES ?`, [city]);
  console.log("insertCity", insertCity);
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

const passengerSearchDetail = async (id, passenger) => {
  const qryStr = `SELECT o.origin, o.destination, FROM_UNIXTIME(o.date) AS date, o.time, o.available_seats, o.fee, o.route_id, u.name, u.picture, u.id 
  FROM offered_routes o INNER JOIN users u ON o.user_id = u.id WHERE o.route_id = ${id}`;
  const driverRoute = await query(qryStr);
  console.log("passengerSearchDetail", driverRoute);
  driverRoute[0].date = await toDateFormat(driverRoute[0].date);

  if (passenger) {
    const passengerRoute = await query(`SELECT origin, destination, FROM_UNIXTIME(date) AS date, persons 
  FROM requested_routes WHERE route_id = ${passenger}`);
    passengerRoute[0].date = await toDateFormat(passengerRoute[0].date);
    return {
      driverRoute: driverRoute[0],
      passengerRoute: passengerRoute[0]
    };
  } else {
    return { driverRoute: driverRoute[0] };
  }
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

const getPassengerItinerary = async (id) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const qryStr = `SELECT o.origin, o.destination, FROM_UNIXTIME(o.date + 28800) AS date, o.time, o.fee, o.seats_left, t.id FROM requested_routes r
  INNER JOIN tour t ON r.route_id = t.passenger_routes_id
  INNER JOIN offered_routes o ON t.offered_routes_id = o.route_id
  INNER JOIN users u ON u.id = o.user_id
  WHERE r.user_id = "${id}" AND UNIX_TIMESTAMP(o.routeTS) >= ${timestamp}`;
  const result = await query(qryStr);
  for (const i in result) {
    result[i].date = await toDateFormat(result[i].date);
  }
  console.log("getPassengerItinerary", result);
  return result;
};

const passengerRequestDetail = async (id) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const result = await query(`SELECT origin, destination, persons, FROM_UNIXTIME(date + 28800) AS date 
  FROM requested_routes WHERE isMatched = 0 AND user_id = ${id} AND date >= ${timestamp} ORDER BY date`);
  for (const i in result) {
    result[i].date = await toDateFormat(result[i].date);
  }
  console.log("passengerRequestDetail", result);
  return result;
};

const setPassengerTour = async (driverRouteId, passengerRouteId, userId, persons, date) => {
  const connection = await mysql.connection();
  await connection.query("START TRANSACTION");
  const driverRoute = await query(`SELECT * FROM offered_routes WHERE route_id = ${driverRouteId}`);
  console.log("*********", userId, driverRoute[0].origin, driverRoute[0].destination, driverRoute[0].date);

  const checkTour = await query(`SELECT * FROM tour t
  INNER JOIN requested_routes r ON t.passenger_routes_id = r.route_id 
  WHERE t.offered_routes_id = ${driverRouteId} AND r.user_id = ${userId} FOR UPDATE`);
  if (checkTour.length > 0) {
    return { error: "Tour had already been created, please check your itinerary" };
  }
  const tour = {
    offered_routes_id: driverRouteId,
    passenger_routes_id: passengerRouteId,
    finished: 0,
    passenger_type: "request",
    match_status: 0
  };
  const insertInfo = await query("INSERT INTO tour SET ?", tour);
  await connection.query("COMMIT");
  const tourId = insertInfo.insertId;
  console.log("insertInfo", insertInfo);
  return { userId, tourId };
};

const getTourInfo = async (tourId) => {
  const connection = await mysql.connection();
  await connection.query("START TRANSACTION");
  const driverInfo = await query(`SELECT o.origin, o.destination, FROM_UNIXTIME(o.date + 28800) AS date, o.time,
  o.seats_left, o.fee, o.user_id, o.route_id, u.id, u.name, u.picture, t.match_status FROM tour t 
  INNER JOIN offered_routes o ON t.offered_routes_id = o.route_id 
  INNER JOIN users u ON o.user_id = u.id WHERE t.id = ${tourId}`);
  driverInfo[0].date = await toDateFormat(driverInfo[0].date);
  console.log("driverInfo", driverInfo);

  const passengerInfo = await query(`SELECT r.route_id, r.origin, r.destination, r.persons, 
  FROM_UNIXTIME(r.date + 28800) AS date, u.id, u.name, u.picture, t.match_status FROM tour t
  INNER JOIN requested_routes r ON t.passenger_routes_id = r.route_id
  INNER JOIN users u ON r.user_id = u.id WHERE t.id = ${tourId}`);
  passengerInfo[0].date = await toDateFormat(passengerInfo[0].date);
  console.log("passengerInfo", passengerInfo);

  const result = {};
  result.driverInfo = driverInfo[0];
  result.passengerInfo = passengerInfo;
  result.tourInfo = { matchStatus: driverInfo[0].match_status };
  console.log("getTourInfo Model:", result);
  return result;
};

const getPassengerDetail = async (id) => {
  const passengerDetail = await query(`SELECT route_id, origin, destination, origin_coordinate, destination_coordinate, persons, FROM_UNIXTIME(date) AS date 
  FROM requested_routes WHERE route_id = ${id}`);
  if (!passengerDetail) {
    return { error: "No such route offered" };
  }
  passengerDetail[0].date = await toDateFormat(passengerDetail[0].date);
  return passengerDetail[0];
};

const filterRoutes = async (routeId, date, persons, originCoordinate, destinationCoordinate) => {
  const qryStr = `SELECT offered_routes_id, coordinate FROM routes_waypoints WHERE city IN 
  (SELECT city FROM requested_routes_cities WHERE requested_routes_id = ${routeId} AND coordinate_type = "origin")
  AND offered_routes_id IN
  (SELECT route_id FROM offered_routes WHERE date = UNIX_TIMESTAMP("${date}") AND seats_left >= ${persons}) `;
  const originCity = await query(qryStr);
  console.log("originCity:", originCity);
  const destinationCity = [];
  for (const i in originCity) {
    if (i > 0) {
      if (originCity[i].offered_routes_id == originCity[i - 1].offered_routes_id) {
        continue;
      }
    }
    const destinationWaypts = await query(`SELECT r.offered_routes_id, r.coordinate, o.origin, o.destination, o.origin_coordinate, o.destination_coordinate,
    FROM_UNIXTIME(o.date+28800) AS date, o.time, o.seats_left, o.user_id, u.name, u.picture FROM routes_waypoints r
    INNER JOIN offered_routes o ON r.offered_routes_id = o.route_id
    INNER JOIN users u ON o.user_id = u.id
    WHERE r.offered_routes_id = ${originCity[i].offered_routes_id} AND r.city IN 
    (SELECT city FROM requested_routes_cities WHERE requested_routes_id = ${routeId} AND coordinate_type = "destination")`);
    console.log("destinationWaypts", destinationWaypts);
    if (destinationWaypts.length < 1) {
      continue;
    }
    destinationWaypts[0].date = await toDateFormat(destinationWaypts[0].date);
    // check direction the same
    const pOriginToDestination = getDistanceFromLatLonInKm(originCoordinate.x, originCoordinate.y,
      destinationWaypts[0].coordinate.x, destinationWaypts[0].coordinate.y);

    const pDestinationToDestination = getDistanceFromLatLonInKm(destinationCoordinate.x, destinationCoordinate.y,
      destinationWaypts[0].coordinate.x, destinationWaypts[0].coordinate.y);
    console.log("pOriginToDestination", pOriginToDestination, pDestinationToDestination, (pOriginToDestination >= pDestinationToDestination));
    if (pOriginToDestination >= pDestinationToDestination) {
      destinationCity.push(destinationWaypts);
    }
  }
  console.log("destinationCity", destinationCity);

  const shortestRoute = await getShortestRoute(originCity, destinationCity, originCoordinate, destinationCoordinate);
  const shortestRouteInOrder = await orderShortestRoute(shortestRoute);

  return shortestRouteInOrder;
};

const confirmTour = async (driverRouteId, tourId, passengerRouteId) => {
  const checkTour = await query(`SELECT match_status FROM tour WHERE id = ${tourId} 
  AND offered_routes_id = ${driverRouteId} AND passenger_routes_id = ${passengerRouteId}`);
  if (checkTour[0].match_status == 1) {
    return ({ error: "The route had already confirmed" });
  }
  const result = await query(`UPDATE tour SET match_status = 1 WHERE id = ${tourId} 
  AND offered_routes_id = ${driverRouteId} AND passenger_routes_id = ${passengerRouteId}`);
  if (result.lenth < 1) {
    return ({ error: "Internal server error" });
  }
  return result;
};

module.exports = {
  requestSeatsInfo,
  passengerSearch,
  passengerSearchDetail,
  setMatchedDriver,
  getPassengerItinerary,
  passengerRequestDetail,
  setPassengerTour,
  getTourInfo,
  getPassengerDetail,
  filterRoutes,
  confirmTour
};
