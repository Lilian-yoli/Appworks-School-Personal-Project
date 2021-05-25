require("dotenv").config();
const Path = require("../models/path_model");
const Util = require("../../util/path");

const requestSeatsInfo = async (req, res) => {
  console.log("controller_req.user:", req.user);
  const { origin, destination, persons, date } = req.body;
  if (!origin || !destination || !persons || !date) {
    res.status(400).send({ error: "Request Error: origin, destination, persons and date are required." });
    return;
  }
  const result = await Path.insertRouteInfo(origin, destination, persons, date, "", req.user.email, "", "requested_routes");
  if (!result) {
    res.status(500).send({ error: "Internal server error" });
    return;
  }
  console.log("path_controller:", result);
  return res.status(200).send(result);
};

const offerSeatsInfo = async (req, res) => {
  console.log("controller_req.user:", req.user);
  const { origin, destination, persons, date, time, fee } = req.body;
  if (!origin || !destination || !persons || !date) {
    res.status(400).send({ error: "Request Error: origin, destination, persons and date are required." });
    return;
  }
  const result = await Path.insertRouteInfo(origin, destination, persons, date, time, req.user.email, fee, "offered_routes");
  if (!result) {
    res.status(500).send({ error: "Internal server error" });
    return;
  }
  console.log("path_controller:", result);
  return res.status(200).send(result);
};

const routeSuggestion = async (req, res) => {
  console.log("routeSuggestion", (req.query));
  const { id } = req.query;
  const getDriverDetail = await Path.getDriverDetail(id);
  console.log("getDriverDetail", getDriverDetail);

  const { date, origin, destination } = getDriverDetail;
  const availableSeats = getDriverDetail.seats_left;
  const originLatLon = `${getDriverDetail.origin_coordinate.x}, ${getDriverDetail.origin_coordinate.y}`;
  const destinationLatLon = `${getDriverDetail.destination_coordinate.x}, ${getDriverDetail.destination_coordinate.y}`;
  console.log("originLatLon", originLatLon);

  const filterRoutesIn5km = await Util.filterRoutesIn5km(originLatLon, destinationLatLon, date, availableSeats);
  const sortAllPassengerByDistance = await Util.sortAllPassengerByDistance(filterRoutesIn5km);

  sortAllPassengerByDistance.push({
    originLatLon: originLatLon,
    destinationLatLon: destinationLatLon,
    origin: origin,
    destination: destination,
    available_seats: availableSeats
  });
  console.log("sortAllPassengerByDistance", sortAllPassengerByDistance);
  res.status(200).send(sortAllPassengerByDistance);
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
  console.log("setMatchedPassenger result:", result);
  res.status(200).send({ result });
};

const getDriverItineraryDetail = async (req, res) => {
  console.log(req.user);
  const { id } = req.query;
  console.log(id);
  const result = await Path.getDriverItineraryDetail(id);
  console.log("result", result);
  console.log("getDriversItinerary", result);
  res.status(200).send(result);
};

const getDriverItinerary = async (req, res) => {
  console.log("req.user123", req.user);
  const result = await Path.getDriverItinerary(req.user.email);
  res.status(200).send(result);
};
module.exports = {
  requestSeatsInfo,
  offerSeatsInfo,
  routeSuggestion,
  setMatchedPassengers,
  getDriverItineraryDetail,
  getDriverItinerary
};
