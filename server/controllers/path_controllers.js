require("dotenv").config();
const Path = require("../models/path_model");
const Util = require("../../util/path");

const offerSeatsInfo = async (req, res) => {
  console.log("controller_req.user:", req.user);
  const { origin, destination, persons, date, time } = req.body;
  if (!origin || !destination || !persons || !date) {
    res.status(400).send({ error: "Request Error: origin, destination, persons and date are required." });
    return;
  }
  const result = await Path.insertRouteInfo(origin, destination, persons, date, time, req.user.id);
  if (result.error) {
    res.status(500).send({ error: result.error });
    return;
  }
  console.log("path_controller:", result);
  const waypoints = await Util.getDirection(result.route[0].origin_coordinate.x + "," + result.route[0].origin_coordinate.y,
    result.route[0].destination_coordinate.x + "," + result.route[0].destination_coordinate.y);
  console.log("waypoints", waypoints);
  const getCity = await Util.wayptsCity(waypoints);
  const saveWaypts = await Path.saveWaypts(getCity, result.route[0].route_id);
  console.log("saveWaypts", saveWaypts);
  return res.status(200).send(result);
};

const routeSuggestion = async (req, res) => {
  console.log("routeSuggestion", (req.query));
  const routeId = req.query.routeid;
  const { name, picture, id } = req.user;
  const getDriverDetail = await Path.getDriverDetail(routeId);
  console.log("getDriverDetail", getDriverDetail);

  const { date, origin, destination } = getDriverDetail;
  const availableSeats = getDriverDetail.seats_left;
  const originLatLon = `${getDriverDetail.origin_coordinate.x}, ${getDriverDetail.origin_coordinate.y}`;
  const destinationLatLon = `${getDriverDetail.destination_coordinate.x}, ${getDriverDetail.destination_coordinate.y}`;
  console.log("originLatLon", originLatLon);

  const filterRoutesIn5km = await Util.filterRoutesIn5km(originLatLon, destinationLatLon, date, availableSeats);
  // const sortAllPassengerByDistance = await Util.sortAllPassengerByDistance(filterRoutesIn5km);
  const result = { passengerInfo: filterRoutesIn5km };
  result.driverInfo = {
    routeId: routeId,
    originLatLon: originLatLon,
    destinationLatLon: destinationLatLon,
    origin: origin,
    destination: destination,
    seats_left: availableSeats,
    date: date,
    time: getDriverDetail.time,
    name: name,
    picture: picture,
    id: id
  };

  filterRoutesIn5km.push();
  console.log("sortAllPassengerByDistance", result);
  res.status(200).send(result);
};

const setMatchedPassengers = async (req, res) => {
  console.log("setMatchedPassenger req.body:", req.body);
  const { passengerRouteId, passengerType, offeredRouteId } = req.body;
  const allToursArr = [];
  let personsCounter = 0;
  for (const i in passengerRouteId) {
    const tourArr = [offeredRouteId, passengerRouteId[i].id, passengerType, 0];
    personsCounter += passengerRouteId[i].persons;
    allToursArr.push(tourArr);
  }
  // allToursArr looks like:[[DriveId, passengerRouteId1], [DriveId, passengerRouteId2]...]
  const result = await Path.setMatchedPassengers(allToursArr, personsCounter);
  if (!result) {
    res.status(500).send({ error: "no route provided" });
  }
  console.log("setMatchedPassenger result:", result);
  res.status(200).send({ result });
};

const getDriverItineraryDetail = async (req, res) => {
  console.log(req.user);
  const routeId = req.query.routeid;
  console.log(routeId);
  const result = await Path.getDriverItineraryDetail(routeId);
  console.log("result", result);
  console.log("getDriversItinerary", result);
  res.status(200).send(result);
};

const getDriverItinerary = async (req, res) => {
  try {
    console.log("req.user123", req.user);
    const result = await Path.getDriverItinerary(req.user.id);
    res.status(200).send(result);
  } catch (error) {
    console.log(error);
  }
};

const getPlaceId = async (req, res) => {
  console.log(req.body);
  const { origin, destination } = req.body;
  const result = await Util.getPlaceId(origin, destination);
  if (!result) {
    return res.status(500).send({ error: "Internal server error" });
  }
  console.log(result);
  res.status(200).send(result);
};

const driverSearch = async (req, res) => {
  console.log(req.query);
  const { origin, destination, date } = req.query;
  console.log(origin, destination, date);
  const result = await Path.driverSearch(origin, destination, date);
  console.log(result);
  if (!result) {
    res.status(200).send({ error: "Not Found" });
  }
  res.status(200).send(result);
};

const driverSearchDetail = async (req, res) => {
  console.log(req.query);
  const { id } = req.query;
  const result = await Path.driverSearchDetail(id);
  res.status(200).send(result);
};

const setDriverTour = async (req, res) => {
  console.log("req.body", req.body);
  const { driverRouteId, passengerRouteId } = req.body;
  const result = await Path.setDriverTour(driverRouteId, passengerRouteId);
  if (result < 1) {
    res.status(500).send({ error: "Internal server error" });
  }
  res.status(200).send({ tourId: result });
};
// const matchSearchedPassengers = async (req, res) => {
//   console.log(req.body);
//   const {id}
//   const {routeId, persons, userId, origin} =req.body
//   const
// };

const getDriverHomepage = async (req, res) => {
  try {
    const result = await Path.getDriverHomepage();
    res.status(200).send(result);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  offerSeatsInfo,
  routeSuggestion,
  setMatchedPassengers,
  getDriverItineraryDetail,
  getDriverItinerary,
  getPlaceId,
  driverSearch,
  driverSearchDetail,
  setDriverTour,
  getDriverHomepage
};
