require("dotenv").config();
const mysql = require("./mysqlcon");
const { transferToLatLng } = require("../../util/util");

const insertRouteInfo = async (origin, destination, persons, date, time, email, mySQLTable) => {
  const connection = await mysql.connection();
  let queryStr;
  if (mySQLTable === "requested_routes") {
    queryStr = `SELECT * FROM ${mySQLTable} WHERE origin = "${origin}" AND destination = "${destination}" AND persons = "${persons}" AND date = "${date}" AND time = "${time}" AND email = "${email}"`;
  } else if (mySQLTable === "offered_routes") {
    queryStr = `SELECT * FROM ${mySQLTable} WHERE origin = "${origin}" AND destination = "${destination}" AND available_seats = "${persons}" AND date = "${date}" AND time = "${time}" AND driver_email = "${email}"`;
  }
  const checkDuplicatedRoute = await connection.query(queryStr);
  console.log("checkDuplicatedRoute", checkDuplicatedRoute);
  if (checkDuplicatedRoute.length > 0) {
    return { error: "Routes had already been created, please check your itinerary" };
  }
  const originLatLon = await transferToLatLng(origin);
  const destinationLatLon = await transferToLatLng(destination);
  if (!originLatLon) {
    return { error: "Couldn't find the origin. Try to type the address." };
  } else if (!destinationLatLon) {
    return { error: "Couldn't find the destination. Try to type the address." };
  }
  let route;
  if (mySQLTable === "requested_routes") {
    route = {
      origin: origin,
      destination: destination,
      persons: persons,
      date: date,
      time: time,
      email: email,
      driver_id: 0,
      origin_lat_lon: originLatLon,
      destination_lat_lon: destinationLatLon
    };
  } else if (mySQLTable === "offered_routes") {
    route = {
      origin: origin,
      destination: destination,
      available_seats: persons,
      date: date,
      time: time,
      driver_email: email,
      origin_lat_lon: originLatLon,
      destination_lat_lon: destinationLatLon
    };
  }

  const insertRoute = await connection.query(`INSERT INTO ${mySQLTable} SET ?`, route);
  console.log("insertRoute", insertRoute);
  route.id = insertRoute.insertId;
  return { route };
};

const getAllplacesByPassengers = async (date) => {
  const connection = await mysql.connection();
  await connection.query("START TRANSACTION");
  const queryStr = "SELECT * FROM requested_routes WHERE date = ?";
  const allPlaces = await connection.query(queryStr, [date]);
  console.log(allPlaces);

  return allPlaces;
};

const getDriverDetail = async (id) => {
  const connection = await mysql.connection();
  const driverDetail = await connection.query(`SELECT * FROM offered_routes WHERE offer_routes_id = ${id}`);
  if (!driverDetail) {
    return { error: "No such route offered" };
  }
  return driverDetail[0];
};

module.exports = {
  insertRouteInfo,
  getAllplacesByPassengers,
  getDriverDetail
};
