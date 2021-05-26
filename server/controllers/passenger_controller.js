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
  const { id } = req.query;
  const result = await Passenger.passengerSearchDetail(id);
  res.status(200).send(result);
};

const setMatchedDriver = async (req, res) => {
  console.log(req.query);
  const { email } = req.user;
  const { id, persons, date } = req.query;
  const result = await Passenger.setMatchedDriver(id, persons, email, date);
  console.log("result", result);
  res.status(200).send({ id: result });
};

const getPassengerItinerary = async (req, res) => {
  console.log(req.user);
  const { email } = req.user;
  const result = await Passenger.getPassengerItinerary(email);
  res.status(200).send(result);
};

const passengerRequestDetail = async (req, res) => {
  console.log("req.user", req.user);
  const { id } = req.user;
  const result = await Passenger.passengerRequestDetail(id);
  res.status(200).send(result);
};

module.exports = {
  passengerSearch,
  passengerSearchDetail,
  setMatchedDriver,
  getPassengerItinerary,
  passengerRequestDetail,
  requestSeatsInfo
};
