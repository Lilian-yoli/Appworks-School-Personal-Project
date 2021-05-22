// eslint-disable-next-line no-unused-vars
const { query } = require("./mysqlcon");
const mysql = require("./mysqlcon");
const { toDateFormat, toTimestamp } = require("../../util/util");

const passengerSearch = async (destination, date, persons) => {
  // const timestamp = await toTimestamp(date);
  const qryStr = `SELECT origin, destination, FROM_UNIXTIME(date) AS date, time, available_seats, fee, route_id FROM offered_routes WHERE destination like "%${destination}%" AND date = UNIX_TIMESTAMP("${date}") AND left_seats >= ${persons}`;
  const result = await query(qryStr);
  for (const i in result) {
    result[i].date = await toDateFormat(result[i].date);
  }
  console.log("passengerSearch", result);
  return result;
};

const passengerSearchDetail = async (id) => {
  const qryStr = `SELECT o.origin, o.destination, FROM_UNIXTIME(o.date) AS date, o.time, o.available_seats, o.fee, u.name, u.picture FROM offered_routes o INNER JOIN users u ON o.driver_email = u.email WHERE o.route_id = ${id}`;
  const result = await query(qryStr);
  console.log("passengerSearchDetail", result);
  result[0].date = await toDateFormat(result[0].date);
  return result;
};

const setMatchedDriver = async (id, persons, email) => {
  const connection = await mysql.connection();
  await connection.query("START TRANSACTION");
  const route = {
    passenger_email: email,
    persons: persons
  };
  const insertRouteTable = await query("INSERT INTO passenger_search_route SET ?", route);
  console.log(insertRouteTable);
  const passengerId = insertRouteTable.insertId;
  await connection.query("COMMIT");
  const tour = {
    offered_routes_id: id,
    passenger_routes_id: passengerId,
    finished: 0,
    passenger_type: "search"
  };

  await connection.query("START TRANSACTION");
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
  const qryStr = `SELECT o.origin, o.destination, FROM_UNIXTIME(o.date) AS date, o.time, o.fee, o.route_id, p.persons FROM passenger_search_route p
  INNER JOIN tour t ON p.route_id = t.passenger_routes_id
  INNER JOIN offered_routes o ON t.offered_routes_id = o.route_id
  WHERE p.passenger_email = "${email}" AND UNIX_TIMESTAMP(o.routeTS) >= ${timestamp}`;
  const result = await query(qryStr);
  console.log("getPassengerItinerary", result);
  return result;
};

module.exports = {
  passengerSearch,
  passengerSearchDetail,
  setMatchedDriver,
  getPassengerItinerary
};
