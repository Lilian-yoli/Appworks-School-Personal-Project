require("dotenv").config();
const validator = require("validator");
const bodyParser = require("body-parser");
const Path = require("../models/path_model");

const requestSeatsInfo = async (req, res) => {
  console.log("controller_req.user:", req.user);
  const { origin, destination, persons, date, time } = req.body;
  if (!origin || !destination || !persons || !date) {
    res.status(400).send({ error: "Request Error: depaturePlace, destinationPlace, persons and date are required." });
    return;
  }
  const result = await Path.insertRequestedRouteInfo(origin, destination, persons, date, time, req.user.email);
  if (!result) {
    res.status(500).send({ error: "Internal server error" });
    return;
  }
  console.log("path_controller:", result);
  return result;
};

module.exports = {
  requestSeatsInfo
};
