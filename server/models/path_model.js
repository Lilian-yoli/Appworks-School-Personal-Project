require("dotenv").config();
const mysql = require("./mysqlcon");
const { transferToLatLng } = require("../../util/util");

const insertRequestedRouteInfo = async (origin, destination, persons, date, time, email) => {
  const connection = await mysql.connection();
  const queryStr = `SELECT * FROM requested_routes WHERE origin = "${origin}" AND destination = "${destination}" AND persons = "${persons}" AND date = "${date}" AND time = "${time}" AND email = "${email}"`;
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

  const route = {
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

  const insertRoute = await connection.query("INSERT INTO requested_routes SET ?", route);
  console.log("insertRoute", insertRoute);
  route.id = insertRoute.insertId;
  return { route };
};

module.exports = {
  insertRequestedRouteInfo
};
