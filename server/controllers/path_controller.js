require("dotenv").config();
const jwt = require("jsonwebtoken");
const { TOKEN_SECRET } = process.env;
const Path = require("../models/path_model");
const Util = require("../../util/path");

const offerSeatsInfo = async (req, res) => {
  try {
    const { origin, destination, persons, date, time } = req.body;
    if (!origin || !destination || !persons || !date || !time) {
      res.status(400).send({ error: "Request Error: origin, destination, persons, time and date are required." });
      return;
    }
    const [routeInfo] = await Path.insertRouteInfo(origin, destination, persons, date, time, req.user.id);
    if (routeInfo.error) {
      res.status(400).send({ error: routeInfo.error });
      return;
    } else if (!routeInfo) {
      res.status(500).send({ error: "Internal server error." });
      return;
    }
    const waypoints = await Util.getDirection(routeInfo.origin_coordinate.x + "," + routeInfo.origin_coordinate.y,
      routeInfo.destination_coordinate.x + "," + routeInfo.destination_coordinate.y);
    const wayptsCity = await Util.getWayptsCity(waypoints);
    const saveWaypts = await Path.saveWaypts(wayptsCity, routeInfo.id);
    return res.status(200).send(routeInfo);
  } catch (err) {
    console.log(err);
  }
};

const routeSuggestion = async (req, res) => {
  try {
    const routeId = req.query.routeid;
    const { name, picture, id } = req.user;
    const getDriverDetail = await Path.getDriverRouteDetail(routeId);
    if (getDriverDetail.error) {
      res.status(400).send(getDriverDetail.error);
    }

    const { date, origin, destination } = getDriverDetail;
    const availableSeats = getDriverDetail.seats_left;
    const originLatLon = `${getDriverDetail.origin_coordinate.x}, ${getDriverDetail.origin_coordinate.y}`;
    const destinationLatLon = `${getDriverDetail.destination_coordinate.x}, ${getDriverDetail.destination_coordinate.y}`;

    const filterRoutesIn20km = await Util.filterRoutesIn20km(originLatLon, destinationLatLon, date, availableSeats);
    const result = { passengerInfo: filterRoutesIn20km };
    result.driverInfo = {
      routeId,
      originLatLon,
      destinationLatLon,
      origin,
      destination,
      date,
      name,
      picture,
      id,
      seats_left: availableSeats,
      time: getDriverDetail.time
    };
    res.status(200).send(result);
  } catch (error) {
    console.log(error);
  }
};

const setMatchedPassengers = async (req, res) => {
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
    return res.status(500).send({ error: "no route provided" });
  }
  res.status(200).send({ result });
};

const getDriverItineraryDetail = async (req, res) => {
  try {
    const { user } = req;
    const routeId = req.query.routeid;
    const driverItineraryDetail = await Path.getDriverItineraryDetail(routeId, user);
    if (driverItineraryDetail.error) {
      return res.status(500).send(driverItineraryDetail);
    }

    res.status(200).send(driverItineraryDetail);
  } catch (err) {
    console.log(err);
  }
};

const getDriverItinerary = async (req, res) => {
  try {
    const driversItinerary = await Path.getDriverItinerary(req.user.id);
    res.status(200).send(driversItinerary);
  } catch (error) {
    console.log(error);
  }
};

const setDriverTour = async (req, res) => {
  try {
    const { driverRouteId, passengerRouteId } = req.body;
    const driverName = req.user.name;
    const tourId = await Path.setDriverTour(driverRouteId, passengerRouteId, req.user.id);
    if (tourId.error) {
      return res.status(400).send({ error: tourId.error });
    }

    res.status(200).send({ tourId, driverInfo: driverName });
  } catch (err) {
    console.log(err);
  }
};

const getDriverHomepage = async (req, res) => {
  try {
    const driverHompage = await Path.getDriverHomepage();
    res.status(200).send(driverHompage);
  } catch (error) {
    console.log(error);
  }
};

const getTourInfo = async (req, res) => {
  try {
    const tourId = req.query.tour;
    const result = await Path.getTourInfo(tourId);

    if (result.error) {
      return res.status(500).send({ error: "Internal server error" });
    }
    result.userId = req.user.id;
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
  }
};

const selectDriverRoute = async (req, res) => {
  try {
    const { date, persons } = req.body;
    const driverRoute = await Path.selectDriverRoute(date, persons, req.user.id);
    if (driverRoute.error) {
      return res.status(400).send(driverRoute);
    }
    res.status(200).send(driverRoute);
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  offerSeatsInfo,
  routeSuggestion,
  setMatchedPassengers,
  getDriverItineraryDetail,
  getDriverItinerary,
  setDriverTour,
  getDriverHomepage,
  getTourInfo,
  selectDriverRoute
};
