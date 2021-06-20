const Passenger = require("../models/passenger_model");
const Util = require("../../util/util");

const requestSeatsInfo = async (req, res) => {
  console.log("controller_req.user:", req.user);
  const { origin, destination, persons, date } = req.body;
  if (!origin || !destination || !persons || !date) {
    res.status(400).send({ error: "Request Error: origin, destination, persons and date are required." });
    return;
  }
  const result = await Passenger.requestSeatsInfo(origin, destination, persons, date, req.user.id);
  if (!result) {
    res.status(500).send({ error: "Internal server error" });
    return;
  }
  console.log("path_controller:", result);
  return res.status(200).send(result);
};

const routesBySearch = async (req, res) => {
  try {
    console.log("req.query", req.query);
    const { origin, destination, date, persons } = req.query;
    if (Util.isPunctuation(decodeURI(origin)) || Util.isPunctuation(decodeURI(destination))) {
      return res.status(400).send({ error: "Invalid Input, punctuation marks are not allowed. " });
    }
    const result = await Passenger.routesBySearch(origin, destination, date, persons);
    console.log(result);
    if (!result) {
      return res.status(500).send({ error: "Not Found" });
    }
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
  }
};

const passengerSearchDetail = async (req, res) => {
  console.log(req.query);
  const { id, passenger } = req.query;
  const result = await Passenger.passengerSearchDetail(id, passenger);
  res.status(200).send(result);
};

const saveSearchPassenger = async (req, res) => {
  try {
    console.log(req.query);
    const userId = req.user.id;
    const driverRouteId = req.query.routeid;
    const { persons, date } = req.body;
    const result = await Passenger.saveSearchPassenger(driverRouteId, persons, date, userId);
    console.log("result", result);
    res.status(200).send({ routeInfo: result });
  } catch (err) {
    console.log(err);
  }
};

const getPassengerItinerary = async (req, res) => {
  console.log(req.user);
  const { id } = req.user;
  const result = await Passenger.getPassengerItinerary(id);
  res.status(200).send(result);
};

const passengerRequestDetail = async (req, res) => {
  console.log("req.user", req.user);
  const { id } = req.user;
  const result = await Passenger.passengerRequestDetail(id);
  res.status(200).send(result);
};

const setPassengerTour = async (req, res) => {
  console.log("req.body", req.body);
  const userId = req.user.id;

  const { driverRouteId, passengerRouteId } = req.body;

  console.log(driverRouteId);
  const result = await Passenger.setPassengerTour(driverRouteId, passengerRouteId, userId);
  if (result < 1) {
    res.status(500).send({ error: "Internal server error" });
  }
  result.username = req.user.name;
  res.status(200).send(result);
};

const getTourInfo = async (req, res) => {
  console.log("tour", req.query);
  const tourId = req.query.tour;
  const result = await Passenger.getTourInfo(tourId, req.user.id);
  result.userId = req.user.id;
  if (result.length < 1) {
    res.status(500).send({ error: "Internal server error" });
  }
  res.status(200).send(result);
};

const suggestPassengerRoute = async (req, res) => {
  console.log(req.query);
  const routeId = req.query.routeid;
  const { name, picture, id } = req.user;
  const getPassengerDetail = await Passenger.getPassengerDetail(routeId);
  console.log("getPassengerDetail", getPassengerDetail);

  const { date, origin, destination, persons } = getPassengerDetail;
  const originLatLon = `${getPassengerDetail.origin_coordinate.x}, ${getPassengerDetail.origin_coordinate.y}`;
  const destinationLatLon = `${getPassengerDetail.destination_coordinate.x}, ${getPassengerDetail.destination_coordinate.y}`;
  console.log("originLatLon", originLatLon);

  const filterRoutes = await Passenger.filterRoutes(routeId, date, persons,
    getPassengerDetail.origin_coordinate, getPassengerDetail.destination_coordinate);
  if (filterRoutes.length < 1) {
    return res.status(500).send({ error: "Internal server error" });
  } else if (filterRoutes.msg) {
    filterRoutes.origin = origin;
    filterRoutes.destination = destination;
    filterRoutes.destinationCoordinate = getPassengerDetail.destination_coordinate;
    filterRoutes.originCoordinate = getPassengerDetail.origin_coordinate;
    return res.status(200).send(filterRoutes);
  }
  getPassengerDetail.id = id;
  const result = { passengerInfo: getPassengerDetail, driverInfo: filterRoutes };
  res.status(200).send(result);
};

const confirmTour = async (req, res) => {
  console.log(req.query);
  const driverRouteId = req.query.routeid;
  const tourId = req.query.tour;
  const { passengerRouteId, matchStatus } = req.body;
  console.log(passengerRouteId, matchStatus);
  const result = await Passenger.confirmTour(driverRouteId, tourId, passengerRouteId, matchStatus);
  if (result.error) {
    return res.status(500).send(result.error);
  }
  res.status(200).send({ status: "updated" });
};

const getPassengerHomepage = async (req, res) => {
  try {
    const result = await Passenger.getPassengerHomepage();
    res.status(200).send(result);
  } catch (error) {
    console.log(error);
  }
};

const getPassengerItineraryDetail = async (req, res) => {
  try {
    console.log("getPassengerItineraryDetail", req.query);
    console.log("getPassengerItineraryDetail REQ.USER", req.user);
    const { user } = req;
    const passengerRouteId = req.query.routeid;
    const passengerItineraryDetail = await Passenger.getPassengerItineraryDetail(passengerRouteId, user);
    if (passengerItineraryDetail.passengerInfo.error) {
      return res.status(500).send(passengerItineraryDetail.passsengerInfo);
    }
    res.status(200).send(passengerItineraryDetail);
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  routesBySearch,
  passengerSearchDetail,
  saveSearchPassenger,
  getPassengerItinerary,
  passengerRequestDetail,
  requestSeatsInfo,
  setPassengerTour,
  getTourInfo,
  suggestPassengerRoute,
  confirmTour,
  getPassengerHomepage,
  getPassengerItineraryDetail
};
