require("dotenv").config();
const direction = require("google-maps-direction");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { GOOGLE_MAP, TOKEN_SECRET } = process.env;
const User = require("../server/models/user_model.js");

const wrapAsync = (fn) => {
  return function (req, res, next) {
    // Make sure to `.catch()` any errors and pass them along to the `next()`
    // middleware in the chain, in this case the error handler.
    fn(req, res, next).catch(next);
  };
};

const authentication = () => {
  return async function (req, res, next) {
    let accessToken = req.get("Authorization");
    if (!accessToken) {
      res.status(401).send({ error: "Unauthorized" });
    }

    accessToken = accessToken.replace("Bearer ", "");
    if (!accessToken) {
      res.status(401).send({ error: "Unauthoized" });
    }
    const user = jwt.verify(accessToken, TOKEN_SECRET);
    console.log("jwt.verify:", user);
    req.user = user;
    const result = await User.getUserDetail(user.email);
    if (!result) {
      res.status(403).send({ error: "Forbidden" });
    } else {
      console.log("authentication_result:", result);
      next();
    }
  };
};

const transferToLatLng = async (location) => {
  const place = encodeURI(location);
  const { data } = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${place}&key=${GOOGLE_MAP}`);
  console.log(data);
  const latLon = data.results[0].geometry.location;
  if (data.status !== "OK") {
    console.log(null);
    return null;
  } else {
    const latLonArr = [];
    latLonArr.push(latLon.lat);
    latLonArr.push(latLon.lon);
    console.log(latLonArr);
    return latLonArr;
  }
};

function getDistanceFromLatLonInKm (start, destination) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(destination[1] - start[1]); // deg2rad below
  const dLon = deg2rad(destination[0] - start[0]);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(start[1])) * Math.cos(deg2rad(destination[1])) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad (deg) {
  return deg * (Math.PI / 180);
}

const getDirection = async (start, destination) => {
  const startEncode = encodeURI(start);
  const destinationEncode = encodeURI(destination);
  const { data } = await axios.get(`https://maps.googleapis.com/maps/api/directions/json?language=zh-TW&origin=${startEncode}&destination=${destinationEncode}&key=${GOOGLE_MAP}`);
  // console.log(data.routes[0].bounds);
  const startArr = [];
  const destinationArr = [];
  const routes = data.routes[0];
  startArr.push(routes.bounds.northeast.lat);
  startArr.push(routes.bounds.northeast.lng);
  destinationArr.push(routes.bounds.southwest.lat);
  destinationArr.push(routes.bounds.southwest.lng);
  // console.log(startArr, destinationArr);

  const waypointObj = { start: startArr, destination: destinationArr };
  for (const i in routes.legs[0].steps) {
    const stepArr = [];
    const stepVariables = "step" + i;
    stepArr.push(routes.legs[0].steps[i].start_location.lat);
    stepArr.push(routes.legs[0].steps[i].start_location.lng);
    waypointObj[stepVariables] = stepArr;
  }
  // console.log(waypointObj);
  return waypointObj;
};

const sortAllPassengerByDistance = () => {
  // eslint-disable-next-line max-len
  const place = { passenger1: { route: [[24.518504, 121.831112], [25.044311, 121.58174]] }, passenger2: { route: [[24.748217, 121.748611], [24.467832, 121.747473]] }, passenger3: { route: [[24.463778, 121.800613], [23.982576, 121.613073]] } };
  const allPassengerDistance = [];
  for (const i in place) {
    const distance = getDistanceFromLatLonInKm(place[i].route[0], place[i].route[1]);
    const passengerInfo = [i, distance, place[i].route[0], place[i].route[1]];
    allPassengerDistance.push(passengerInfo);
  }

  allPassengerDistance.sort((a, b) => {
    return a[1] - b[1];
  });
  allPassengerDistance.reverse();
  return allPassengerDistance;
};

module.exports = {
  wrapAsync,
  authentication,
  transferToLatLng,
  getDistanceFromLatLonInKm,
  getDirection,
  sortAllPassengerByDistance
};
