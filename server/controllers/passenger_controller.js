const Passenger = require("../models/passenger_model");

const passengerSearch = async (req, res) => {
  console.log("req.query", req.query);
  const { origin, destination, date, persons } = req.query;
  const result = await Passenger.passengerSearch(origin, destination, date, persons);
  console.log(result);
  if (!result) {
    res.status(200).send("Not Found");
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
  const { email } = req.user;
  const result = await Passenger.passengerRequestDetail(email);
  res.status(200).send(result);
};

module.exports = {
  passengerSearch,
  passengerSearchDetail,
  setMatchedDriver,
  getPassengerItinerary,
  passengerRequestDetail
};
