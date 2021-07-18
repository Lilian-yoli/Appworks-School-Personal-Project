const Passenger = require("../models/passenger_model");
const Util = require("../../util/util");
const validator = require("validator");

const requestSeatsInfo = async (req, res) => {
  try {
    const { origin, destination, persons, date } = req.body;
    if (!origin || !destination || !persons || !date) {
      res.status(400).send({ error: "Request Error: origin, destination, persons and date are required." });
      return;
    }
    // Insert into DB
    const result = await Passenger.requestSeatsInfo(origin, destination, persons, date, req.user.id);
    if (result.error) {
      res.status(400).send(result);
      return;
    }
    return res.status(200).send(result);
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Internal server error." });
  }
};

const routesBySearch = async (req, res) => {
  try {
    const { origin, destination, date, persons } = req.query;
    // check if malicious input existed
    if (Util.isPunctuation(decodeURI(origin)) || Util.isPunctuation(decodeURI(destination)) || Util.isPunctuation(persons)) {
      return res.status(400).send({ error: "Invalid Input, punctuation marks are not allowed. " });
    }
    if (!validator.isDate(date)) {
      return res.status(400).send({ error: "Date format not correct." });
    }
    const routes = await Passenger.routesBySearch(origin, destination, date, persons);
    res.status(200).send(routes);
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Internal server error." });
  }
};

const saveSearchPassenger = async (req, res) => {
  try {
    const userId = req.user.id;
    const driverRouteId = req.query.routeid;
    const { persons, date } = req.body;
    const result = await Passenger.saveSearchPassenger(driverRouteId, persons, date, userId);
    if (result.error) {
      return res.status(400).send(result);
    }
    res.status(200).send({ routeId: result, passengerName: req.user.name });
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Internal server error." });
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
    res.status(500).send({ error: "Internal server error." });
  }
};

const setPassengerTour = async (req, res) => {
  try {
    const userId = req.user.id;
    const { driverRouteId, passengerRouteId } = req.body;

    const result = await Passenger.setPassengerTour(driverRouteId, passengerRouteId, userId);
    if (result.error) {
      return res.status(400).send(result);
    }
    result.username = req.user.name;
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: "Internal server error." });
  }
};

const getTourInfo = async (req, res) => {
  try {
    console.log(req.query);
    const tourId = req.query.tour;
    const tourInfo = await Passenger.getTourInfo(tourId, req.user.id);
    tourInfo.userId = req.user.id;
    if (tourInfo.error || !tourInfo) {
      return res.status(500).send(tourInfo);
    }
    console.log("getTourInfo", tourInfo);
    res.status(200).send(tourInfo);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: "Internal server error." });
  }
};

const suggestPassengerRoute = async (req, res) => {
  console.log(req.query);
  try {
    const routeId = req.query.routeid;
    const { id } = req.user;
    const getPassengerDetail = await Passenger.getPassengerDetail(routeId);

    const { date, origin, destination, persons } = getPassengerDetail;
    // get the coordinte to do the distance calculation
    const originLatLon = `${getPassengerDetail.origin_coordinate.x}, ${getPassengerDetail.origin_coordinate.y}`;
    const destinationLatLon = `${getPassengerDetail.destination_coordinate.x}, ${getPassengerDetail.destination_coordinate.y}`;

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

const confirmTour = async (req, res, next) => {
  try {
    const driverRouteId = req.query.routeid;
    const tourId = req.query.tour;
    const { passengerRouteId, matchStatus, persons } = req.body;

    const tourConfirmed = await Passenger.confirmTour(driverRouteId, tourId, passengerRouteId, matchStatus, persons);
    if (tourConfirmed.error || !tourConfirmed) {
      return res.status(400).send(tourConfirmed);
    }

    res.status(200).send({ status: "updated" });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: "Internal server error." });
  }
};

const getPassengerHomepage = async (req, res) => {
  try {
    console.log(123);
    const routes = await Passenger.getPassengerHomepage();
    res.status(200).send(routes);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal server error." });
  }
};

const getPassengerItineraryDetail = async (req, res) => {
  try {
    const { user } = req;
    const passengerRouteId = req.query.routeid;
    const passengerItineraryDetail = await Passenger.getPassengerItineraryDetail(passengerRouteId, user);
    if (passengerItineraryDetail.error) {
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
