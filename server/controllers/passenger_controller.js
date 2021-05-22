const Passenger = require("../models/passenger_model");

const passengerSearch = async (req, res) => {
  console.log("req.query", req.query);
  const { destination, date, persons } = req.query;
  const result = await Passenger.passengerSearch(destination, date, persons);
  console.log(result);
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
  const { id, persons, date, destination } = req.query;
  const result = await Passenger.setMatchedDriver(id, persons, email, date, destination);
  console.log("result", result);
  res.status(200).send({ result });
};

const getPassengerItinerary = async (req, res) => {
  console.log(req.user);
  const { email } = req.user;
  const result = await Passenger.getPassengerItinerary(email);
  res.status(200).send(result);
};

module.exports = {
  passengerSearch,
  passengerSearchDetail,
  setMatchedDriver,
  getPassengerItinerary
};
