const Passenger = require("../models/passenger_model");
const Util = require("../../util/util");
const validator = require("validator");

const requestSeatsInfo = async (req, res) => {
  console.log("controller_req.user:", req.user);
  try {
    const { origin, destination, persons, date } = req.body;
    if (!origin || !destination || !persons || !date) {
      res.status(400).send({ error: "Request Error: origin, destination, persons and date are required." });
      return;
    }
    const result = await Passenger.requestSeatsInfo(origin, destination, persons, date, req.user.id);
    if (result.error) {
      res.status(400).send(result);
      return;
    }
    console.log("path_controller:", result);
    return res.status(200).send(result);
  } catch (err) {
    console.log(err);
  }
};

const routesBySearch = async (req, res) => {
  try {
    console.log("req.query", req.query);
    const { origin, destination, date, persons } = req.query;
    if (Util.isPunctuation(decodeURI(origin)) || Util.isPunctuation(decodeURI(destination)) || Util.isPunctuation(persons)) {
      return res.status(400).send({ error: "Invalid Input, punctuation marks are not allowed. " });
    }
    if (!validator.isDate(date)) {
      return res.status(400).send({ error: "Date format not correct." });
    }
    const routes = await Passenger.routesBySearch(origin, destination, date, persons);
    console.log(routes);
    res.status(200).send(routes);
  } catch (err) {
    console.log(err);
  }
};

const saveSearchPassenger = async (req, res) => {
  try {
    console.log(req.query);
    const userId = req.user.id;
    const driverRouteId = req.query.routeid;
    const { persons, date } = req.body;
    const result = await Passenger.saveSearchPassenger(driverRouteId, persons, date, userId);
    console.log("result", result);
    if (result.error400) {
      res.status(400).send(result);
    }
    if (result.error500) {
      res.status(500).send(result);
    }
    res.status(200).send({ routeId: result, passengerName: req.user.name });
  } catch (err) {
    console.log(err);
  }
};

const getPassengerItinerary = async (req, res) => {
  console.log(req.user);
  try {
    const { id } = req.user;
    const result = await Passenger.getPassengerItinerary(id);
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
  }
};

const setPassengerTour = async (req, res) => {
  console.log("req.body", req.body);
  try {
    const userId = req.user.id;

    const { driverRouteId, passengerRouteId } = req.body;

    console.log(driverRouteId);
    const result = await Passenger.setPassengerTour(driverRouteId, passengerRouteId, userId);
    if (result < 1) {
      return res.status(500).send({ error: "Internal server error" });
    }
    result.username = req.user.name;
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
  }
};

const getTourInfo = async (req, res) => {
  console.log("tour", req.query);
  try {
    const tourId = req.query.tour;
    const tourInfo = await Passenger.getTourInfo(tourId, req.user.id);
    tourInfo.userId = req.user.id;
    if (tourInfo.error || !tourInfo) {
      return res.status(500).send(tourInfo);
    }
    res.status(200).send(tourInfo);
  } catch (err) {
    console.log(err);
  }
};

const suggestPassengerRoute = async (req, res) => {
  console.log(req.query);
  try {
    const routeId = req.query.routeid;
    const { id } = req.user;
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
    getPassengerDetail.userId = id;
    const result = { passengerInfo: getPassengerDetail, driverInfo: filterRoutes };
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
  }
};

const confirmTour = async (req, res) => {
  console.log(req.query);
  try {
    const driverRouteId = req.query.routeid;
    const tourId = req.query.tour;
    const { passengerRouteId, matchStatus, persons } = req.body;
    console.log(passengerRouteId, matchStatus);
    const tourConfirmed = await Passenger.confirmTour(driverRouteId, tourId, passengerRouteId, matchStatus, persons);
    if (tourConfirmed.error500 || !tourConfirmed) {
      return res.status(500).send(tourConfirmed);
    } else if (tourConfirmed.error500) {
      return res.status(400).send(tourConfirmed);
    }
    res.status(200).send({ status: "updated" });
  } catch (err) {
    console.log(err);
  }
};

const getPassengerHomepage = async (req, res) => {
  try {
    const routes = await Passenger.getPassengerHomepage();
    if (!routes) {
      res.status(500).send({ error: "Internal server error." });
    }
    res.status(200).send(routes);
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
    if (passengerItineraryDetail.error) {
      console.log(passengerItineraryDetail.error);
      return res.status(500).send(passengerItineraryDetail);
    }
    res.status(200).send(passengerItineraryDetail);
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  routesBySearch,
  saveSearchPassenger,
  getPassengerItinerary,
  requestSeatsInfo,
  setPassengerTour,
  getTourInfo,
  suggestPassengerRoute,
  confirmTour,
  getPassengerHomepage,
  getPassengerItineraryDetail
};
