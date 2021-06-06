const Passenger = require("../models/passenger_model");

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

const passengerSearch = async (req, res) => {
  console.log("req.query", req.query);
  const { origin, destination, date, persons } = req.query;
  const result = await Passenger.passengerSearch(origin, destination, date, persons);
  console.log(result);
  if (!result) {
    res.status(200).send({ error: "Not Found" });
  }
  res.status(200).send(result);
};

const passengerSearchDetail = async (req, res) => {
  console.log(req.query);
  const { id, passenger } = req.query;
  const result = await Passenger.passengerSearchDetail(id, passenger);
  res.status(200).send(result);
};

const setMatchedDriver = async (req, res) => {
  console.log(req.query);
  const userId = req.user.id;
  const driverRouteId = req.query.id;
  const { persons, date } = req.query;
  const result = await Passenger.setMatchedDriver(driverRouteId, persons, date, userId);
  console.log("result", result);
  res.status(200).send({ result });
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

  const { driverRouteId, persons, date, passengerRouteId } = req.body;
  console.log(driverRouteId);
  const result = await Passenger.setPassengerTour(driverRouteId, passengerRouteId, userId, persons, date);
  if (result < 1) {
    res.status(500).send({ error: "Internal server error" });
  }
  res.status(200).send(result);
};

const getTourInfo = async (req, res) => {
  console.log("tour", req.query);
  const tourId = req.query.tour;
  const result = await Passenger.getTourInfo(tourId);
  result.userId = req.user.id;
  result.tourInfo = { tourId: tourId };
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
  const { passengerRouteId } = req.body;
  const result = await Passenger.confirmTour(driverRouteId, tourId, passengerRouteId);
  if (result.error) {
    return res.status(500).send(result.error);
  }
  res.status(200).send({ status: "updated" });
};

module.exports = {
  passengerSearch,
  passengerSearchDetail,
  setMatchedDriver,
  getPassengerItinerary,
  passengerRequestDetail,
  requestSeatsInfo,
  setPassengerTour,
  getTourInfo,
  suggestPassengerRoute,
  confirmTour
};
