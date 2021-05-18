require("dotenv").config();
const Path = require("../models/path_model");
const Util = require("../../util/path");

const requestSeatsInfo = async (req, res) => {
  console.log("controller_req.user:", req.user);
  const { origin, destination, persons, date, time } = req.body;
  if (!origin || !destination || !persons || !date) {
    res.status(400).send({ error: "Request Error: origin, destination, persons and date are required." });
    return;
  }
  const result = await Path.insertRouteInfo(origin, destination, persons, date, time, req.user.email, "requested_routes");
  if (!result) {
    res.status(500).send({ error: "Internal server error" });
    return;
  }
  console.log("path_controller:", result);
  return res.status(200).send(result);
};

const offerSeatsInfo = async (req, res) => {
  console.log("controller_req.user:", req.user);
  const { origin, destination, persons, date, time } = req.body;
  if (!origin || !destination || !persons || !date) {
    res.status(400).send({ error: "Request Error: origin, destination, persons and date are required." });
    return;
  }
  const result = await Path.insertRouteInfo(origin, destination, persons, date, time, req.user.email, "offered_routes");
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

  const { seats, date, time } = getDriverDetail;
  const origin = JSON.parse(getDriverDetail.origin_lat_lon);
  const destination = JSON.parse(getDriverDetail.destination_lat_lon);
  const originLatLon = `${origin.lat}, ${origin.lng}`;
  const destinationLatLon = `${destination.lat}, ${destination.lng}`;
  console.log("originLatLon", originLatLon);
  const filterRoutesIn5km = await Util.filterRoutesIn5km(originLatLon, destinationLatLon, date, time);
  const sortAllPassengerByDistance = await Util.sortAllPassengerByDistance(filterRoutesIn5km);
  sortAllPassengerByDistance.push({ origin: originLatLon, destination: destinationLatLon });
  console.log("sortAllPassengerByDistance", sortAllPassengerByDistance);
  res.status(200).send(sortAllPassengerByDistance);
};

module.exports = {
  requestSeatsInfo,
  offerSeatsInfo,
  routeSuggestion
};
