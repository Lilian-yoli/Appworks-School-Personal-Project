// eslint-disable-next-line no-unused-vars
const { query } = require("./mysqlcon");
const mysql = require("./mysqlcon");
const Util = require("../../util/util");
const { redisClient, getHomepageRoutes, setHomepageRoutes } = require("../../util/redis");

const requestSeatsInfo = async (origin, destination, persons, date, id) => {
  const connection = await mysql.connection();
  try {
    await connection.query("START TRANSACTION");
    const queryStr = `SELECT * FROM requested_routes WHERE origin = "${origin}" AND destination = "${destination}" AND persons = ${persons} AND date = UNIX_TIMESTAMP("${date}") AND user_id = ${id} FOR UPDATE`;

    const checkDuplicatedRoute = await query(queryStr);
    if (checkDuplicatedRoute.length > 0) {
      await connection.query("COMMIT");
      return { error: "Routes had already been created, please check your itinerary" };
    }
    const originLatLng = await Util.transferToLatLng(origin);
    const destinationLatLng = await Util.transferToLatLng(destination);
    const now = Math.floor(Date.now() / 1000);

    // check if the route is existed or not
    if (!originLatLng || !destinationLatLng) {
      return { error: "Couldn't find the origin. Try to type the address." };
    } else if (!destinationLatLng) {
      return { error: "Couldn't find the destination. Try to type the address." };
    }
    // calculate the distance and save to DB
    const distance = Util.getDistanceFromLatLonInKm(originLatLng.lat, originLatLng.lng, destinationLatLng.lat, destinationLatLng.lng);

    const columns = `(origin, destination, persons, date, user_id, origin_coordinate, 
      destination_coordinate, passenger_type, matched, created_at, updated_at, distance)`;

    const setValue = `("${origin}", "${destination}", "${persons}",
    UNIX_TIMESTAMP("${date}"), ${id}, Point("${originLatLng.lat}", "${originLatLng.lng}"),
  Point("${destinationLatLng.lat}", "${destinationLatLng.lng}"), "request", 0, "${now}", "${now}", ${distance})`;

    const insertRoute = await query(`INSERT INTO requested_routes ${columns} VALUES ${setValue}`);
    const routeId = insertRoute.insertId;
    const route = await query(`SELECT * FROM requested_routes WHERE id = ${routeId}`);

    // save the cities of origin and destinatino in requested_routes_cities table for driver recommendation
    const originCity = await Util.getCity(originLatLng);
    const destinationCity = await Util.getCity(destinationLatLng);
    const city = [[routeId, originCity, "origin", now], [routeId, destinationCity, "destination", now]];
    const insertCity = await query(`INSERT INTO requested_routes_cities 
  (requested_routes_id, city, coordinate_type, created_at) VALUES ?`, [city]);
    await connection.query("COMMIT");
    return { route };
  } catch (err) {
    await connection.query("ROLLBACK");
    console.log(err);
  }
};

const routesBySearch = async (origin, destination, date, persons) => {
  try {
    const qryStr = `SELECT origin, destination, FROM_UNIXTIME(date) AS date, time, seats_left, id 
  FROM offered_routes WHERE origin like"%${origin}%" AND destination like "%${destination}%" AND date = UNIX_TIMESTAMP("${date}") AND seats_left >= ${persons}`;
    const routes = await query(qryStr);
    for (const route of routes) {
      route.date = await Util.toDateFormat(route.date);
    }
    console.log("passengerSearch", routes);
    if (routes.length < 1) {
      return { error: "Not Found" };
    } else {
      return routes;
    }
  } catch (err) {
    console.log(err);
  }
};

const passengerSearchDetail = async (id, passenger) => {
  const qryStr = `SELECT o.origin, o.destination, FROM_UNIXTIME(o.date) AS date, o.time, o.available_seats, o.fee, o.id, u.name, u.picture, u.id 
  FROM offered_routes o INNER JOIN users u ON o.user_id = u.id WHERE o.id = ${id}`;
  const driverRoute = await query(qryStr);
  console.log("passengerSearchDetail", driverRoute);
  driverRoute[0].date = await Util.toDateFormat(driverRoute[0].date);

  if (passenger) {
    const passengerRoute = await query(`SELECT origin, destination, FROM_UNIXTIME(date) AS date, persons 
  FROM requested_routes WHERE id = ${passenger}`);
    passengerRoute[0].date = await Util.toDateFormat(passengerRoute[0].date);
    return {
      driverRoute: driverRoute[0],
      passengerRoute: passengerRoute[0]
    };
  } else {
    return { driverRoute: driverRoute[0] };
  }
};

const saveSearchPassenger = async (driverRouteId, persons, date, userId) => {
  const connection = await mysql.connection();
  await connection.query("START TRANSACTION");

  const driverRoute = await query(`SELECT * FROM offered_routes WHERE id = ${driverRouteId}`);

  console.log("driverRoute", driverRoute);
  try {
    const now = Math.floor(Date.now() / 1000);
    const routeInfo = [driverRoute[0].origin, driverRoute[0].destination, `UNIX_TIMESTAMP("${date}")`, userId];
    const checkRoute = await query(`SELECT * FROM requested_routes WHERE origin = "${driverRoute[0].origin}" AND destination = "${driverRoute[0].destination}" 
    AND date = UNIX_TIMESTAMP("${date}") AND user_id = ${userId}`);

    if (checkRoute.length > 0) {
      return { error: "route had already been created" };
    }
    // distance update for search type passengers
    const distance = await Util.getDistanceFromLatLonInKm(driverRoute[0].origin_coordinate.x, driverRoute[0].origin_coordinate.y,
      driverRoute[0].destination_coordinate.x, driverRoute[0].destination_coordinate.y);
    const column = `(origin, destination, persons, date, origin_coordinate, destination_coordinate, 
    passenger_type, user_id, created_at, updated_at, distance, matched)`;
    const setValue = `("${driverRoute[0].origin}", "${driverRoute[0].destination}", ${persons},
  UNIX_TIMESTAMP("${date}"), Point("${driverRoute[0].origin_coordinate.x}", "${driverRoute[0].origin_coordinate.y}"),
Point("${driverRoute[0].destination_coordinate.x}", "${driverRoute[0].destination_coordinate.y}"), 
"search", ${userId}, "${now}", "${now}", ${distance}, 0)`;

    const insertRouteTable = await query(`INSERT INTO requested_routes ${column} VALUES ${setValue}`);
    console.log(insertRouteTable);
    const insertId = insertRouteTable.insertId;
    await connection.query("COMMIT");
    return insertId;
  } catch (err) {
    await connection.query("ROLLBACK");
    console.log(err);
    return null;
  }
};

const getPassengerItinerary = async (id) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const qryStrMatched = `SELECT o.origin, o.destination, FROM_UNIXTIME(o.date) AS date, o.time, 
   r.persons, o.id AS driverRouteId, r.id, t.id AS tourId FROM requested_routes r
  INNER JOIN tour t ON r.id = t.passenger_routes_id
  INNER JOIN offered_routes o ON t.offered_routes_id = o.id
  INNER JOIN users u ON u.id = o.user_id
  WHERE r.user_id = "${id}" AND UNIX_TIMESTAMP(o.route_timestamp) >= ${timestamp} ORDER by date`;
    let matched = await query(qryStrMatched);
    // if matched is an empty array, return no itinerary
    if (matched.length < 1) {
      matched = { empty: "行程尚未進行媒合" };
    } else {
      for (const route of matched) {
        route.date = await Util.toDateFormat(route.date);
      }
    }

    const qryStrUnmatched = `SELECT r.origin, r.destination, FROM_UNIXTIME(r.date) AS date, r.persons, r.id 
    FROM requested_routes r LEFT OUTER JOIN tour t ON r.id = t.passenger_routes_id 
    WHERE r.user_id = ${id} AND t.id IS NULL AND r.date >= ${timestamp} ORDER by date`;
    let unmatched = await query(qryStrUnmatched);
    // if matched is an empty array, return no itinerary
    if (unmatched.length < 1) {
      unmatched = { empty: "尚未建立行程" };
    } else {
      for (const route of unmatched) {
        route.date = await Util.toDateFormat(route.date);
      }
    }

    const result = {};
    result.matched = matched;
    result.unmatched = unmatched;
    return result;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const passengerRequestDetail = async (id) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const result = await query(`SELECT origin, destination, persons, FROM_UNIXTIME(date) AS date 
  FROM requested_routes WHERE matched = 0 AND user_id = ${id} AND date >= ${timestamp} ORDER BY date`);
  for (const i in result) {
    result[i].date = await Util.toDateFormat(result[i].date);
  }
  console.log("passengerRequestDetail", result);
  return result;
};

const setPassengerTour = async (driverRouteId, passengerRouteId, userId) => {
  const connection = await mysql.connection();
  try {
    await connection.query("START TRANSACTION");
    const driverRoute = await query(`SELECT * FROM offered_routes WHERE id = ${driverRouteId}`);

    const checkTour = await query(`SELECT * FROM tour t
    INNER JOIN requested_routes r ON t.passenger_routes_id = r.id 
    WHERE t.offered_routes_id = ${driverRouteId} AND r.user_id = ${userId} FOR UPDATE`);

    if (checkTour.length > 0) {
      return { error: "Tour had already been created, please check your itinerary" };
    }
    const tour = {
      offered_routes_id: driverRouteId,
      passenger_routes_id: passengerRouteId,
      finished: 0,
      passenger_type: "request",
      match_status: 0,
      send_by: userId
    };
    const insertInfo = await query("INSERT INTO tour SET ?", tour);
    await connection.query("COMMIT");
    const tourId = insertInfo.insertId;
    return { userId, tourId };
  } catch (err) {
    console.log(err);
    return null;
  }
};

const getTourInfo = async (tourId, userId) => {
  const connection = await mysql.connection();
  try {
    await connection.query("START TRANSACTION");
    const driverInfo = await query(`SELECT o.origin, o.destination, FROM_UNIXTIME(o.date) AS date, o.time,
  o.seats_left, o.id AS routeId, u.id AS userId, u.name, u.picture, t.match_status, t.send_by, o.origin_coordinate, o.destination_coordinate
  FROM tour t INNER JOIN offered_routes o ON t.offered_routes_id = o.id 
  INNER JOIN users u ON o.user_id = u.id WHERE t.id = ${tourId}`);
    driverInfo[0].date = await Util.toDateFormat(driverInfo[0].date);

    const passengerInfo = await query(`SELECT r.id AS routeId, r.origin, r.destination, r.persons, 
  FROM_UNIXTIME(r.date) AS date, u.id AS userId, u.name, u.picture, t.match_status, r.origin_coordinate, r.destination_coordinate FROM tour t
  INNER JOIN requested_routes r ON t.passenger_routes_id = r.id
  INNER JOIN users u ON r.user_id = u.id WHERE t.id = ${tourId} AND r.user_id = ${userId}`);
    passengerInfo[0].date = await Util.toDateFormat(passengerInfo[0].date);

    const result = {};
    result.driverInfo = driverInfo[0];
    result.passengerInfo = passengerInfo;
    result.tourInfo = { tourId: tourId, matchStatus: driverInfo[0].match_status, sendBy: driverInfo[0].send_by };
    return result;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const getPassengerDetail = async (id) => {
  try {
    const passengerDetail = await query(`SELECT id AS routeId, origin, destination, origin_coordinate, destination_coordinate, persons, FROM_UNIXTIME(date) AS date 
  FROM requested_routes WHERE id = ${id}`);
    if (!passengerDetail) {
      return { error: "No such route offered" };
    }
    passengerDetail[0].date = await Util.toDateFormat(passengerDetail[0].date);
    return passengerDetail[0];
  } catch (err) {
    console.log(err);
    return null;
  }
};

const filterRoutes = async (routeId, date, persons, originCoordinate, destinationCoordinate) => {
  try {
    // filter the same city with origin from routes_waypoints
    const qryStr = `SELECT offered_routes_id, coordinate FROM routes_waypoints WHERE city IN 
  (SELECT city FROM requested_routes_cities WHERE requested_routes_id = ${routeId} AND coordinate_type = "origin")
  AND offered_routes_id IN
  (SELECT id FROM offered_routes WHERE date = UNIX_TIMESTAMP("${date}") AND seats_left >= ${persons}) `;
    const originCity = await query(qryStr);

    const destinationCity = [];
    for (const i in originCity) {
      if (i > 0) {
        // if the filtered location route id was already operated, then skip it
        if (originCity[i].offered_routes_id == originCity[i - 1].offered_routes_id) {
          continue;
        }
      }
      const destinationWaypts = await query(`SELECT r.offered_routes_id, r.coordinate, o.origin, o.destination, o.origin_coordinate, o.destination_coordinate,
    FROM_UNIXTIME(o.date) AS date, o.time, o.seats_left, o.user_id, u.name, u.picture FROM routes_waypoints r
    INNER JOIN offered_routes o ON r.offered_routes_id = o.id
    INNER JOIN users u ON o.user_id = u.id
    WHERE r.offered_routes_id = ${originCity[i].offered_routes_id} AND r.city IN 
    (SELECT city FROM requested_routes_cities WHERE requested_routes_id = ${routeId} AND coordinate_type = "destination")`);

      if (destinationWaypts.length < 1) {
        continue;
      }
      destinationWaypts[0].date = await Util.toDateFormat(destinationWaypts[0].date);
      // check direction the same
      // if the distance of passengers' origin to drivers' destination is smaller than the the distance of passengers' detination to drivers' destination, then the direction is opposites
      const pOriginToDestination = await Util.getDistanceFromLatLonInKm(originCoordinate.x, originCoordinate.y,
        destinationWaypts[0].coordinate.x, destinationWaypts[0].coordinate.y);
      const pDestinationToDestination = await Util.getDistanceFromLatLonInKm(destinationCoordinate.x, destinationCoordinate.y,
        destinationWaypts[0].coordinate.x, destinationWaypts[0].coordinate.y);
      if (pOriginToDestination >= pDestinationToDestination) {
        destinationCity.push(destinationWaypts);
      }
    }
    if (destinationCity.length < 1) {
      return ({ msg: "無合適的行程" });
    }

    const shortestRoute = await Util.getShortestRoute(originCity, destinationCity, originCoordinate, destinationCoordinate);
    const shortestRouteInOrder = await Util.orderShortestRoute(shortestRoute);

    return shortestRouteInOrder;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const confirmTour = async (driverRouteId, tourId, passengerRouteId, matchStatus, persons) => {
  try {
    const tourCheck = await query(`SELECT match_status FROM tour WHERE offered_routes_id = ${driverRouteId} AND passenger_routes_id = ${passengerRouteId}`);
    if (tourCheck[0].match_status == 1) {
      return ({ error: "The route had already confirmed" });
    }
    const matchUpadte = await query(`UPDATE tour SET match_status = ${matchStatus} WHERE id = ${tourId} 
  AND offered_routes_id = ${driverRouteId} AND passenger_routes_id = ${passengerRouteId}`);
    if (persons > 0 && matchStatus > 0) {
      const personsUpdate = await query(`UPDATE offered_routes SET seats_left = (seats_left - ${persons}) WHERE 
    id = ?`, driverRouteId);
    }

    return matchUpadte;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const getPassengerHomepage = async () => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const routes = await query(`SELECT r.origin, r.destination, FROM_UNIXTIME(r.date) AS date, r.persons, r.id
    FROM requested_routes r LEFT OUTER JOIN tour t ON r.id = passenger_routes_id
    WHERE r.date > ${timestamp} AND t.id IS NULL ORDER BY date LIMIT 6`);
    if (routes.length < 1) {
      return null;
    }
    // if redis existed get from redis
    const routesFromRedis = await getHomepageRoutes("passengerRoute", routes);
    if (routesFromRedis) {
      return { routes: routesFromRedis };
    }
    for (const route of routes) {
      route.date = await Util.toDateFormat(route.date);
      route.photo = await Util.getGooglePhoto(route.destination);
      if (!route.photo) {
        continue;
      }
      route.origin = await Util.trimAddress(route.origin);
      route.destination = await Util.trimAddress(route.destination);
    }
    // eslint-disable-next-line no-unused-vars
    const setRouteToRedis = setHomepageRoutes("passengerRoute", routes);
    return { routes };
  } catch (err) {
    console.log(err);
    return null;
  }
};

const getPassengerItineraryDetail = async (routeId, user) => {
  try {
    // To get passenger route info
    const timestamp = Math.floor(Date.now() / 1000);
    const passengerInfo = await query(`SELECT r.origin, r.destination, FROM_UNIXTIME(r.date) AS date, r.persons, 
  r.origin_coordinate, r.destination_coordinate, u.name, u.picture, u.id AS userId, r.id AS routeId FROM requested_routes r 
  INNER JOIN users u ON r.user_id = u.id WHERE r.id = ${routeId} AND r.date >= ${timestamp}`);
    if (passengerInfo.length < 1) {
      return { error: "Route has no longer existed, redirect to the home page" };
    }
    passengerInfo[0].date = await Util.toDateFormat(passengerInfo[0].date);
    // if user logged in, get user ID
    let userInfo;
    if (user) {
      userInfo = await query("SELECT id FROM users WHERE email = ?", [user.email]);
    }
    const result = { passengerInfo, userInfo };
    return result;
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  requestSeatsInfo,
  routesBySearch,
  passengerSearchDetail,
  saveSearchPassenger,
  getPassengerItinerary,
  passengerRequestDetail,
  setPassengerTour,
  getTourInfo,
  getPassengerDetail,
  filterRoutes,
  confirmTour,
  getPassengerHomepage,
  getPassengerItineraryDetail
};
