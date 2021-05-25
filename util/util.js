require("dotenv").config();
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
    console.log("!accessToken", accessToken, (!accessToken));
    if (!accessToken) {
      res.status(401).send({ error: "Unauthoized" });
    }
    const user = jwt.verify(accessToken, TOKEN_SECRET);
    console.log("jwt.verify:", user);
    req.user = user;
    const result = await User.getUserDetail(user.email);
    console.log("result", result);
    if (!result) {
      res.status(403).send({ error: "Forbidden" });
    } else {
      console.log("authentication_result:", result);
      next();
    }
  };
};

function getDistanceFromLatLonInKm (lat1, lng1, lat2, lng2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1); // deg2rad below
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad (deg) {
  return deg * (Math.PI / 180);
}

const toTimestamp = async (date) => {
  console.log(date);
  const dateArr = date.split("-");
  const datum = new Date(Date.UTC(dateArr[0], dateArr[1] - 1, dateArr[2]));
  return datum.getTime() / 1000;
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
    const latLonObj = { lat: latLon.lat, lng: latLon.lng };
    return latLonObj;
  }
};

const toDateFormat = async (fromUnixtime) => {
  fromUnixtime = fromUnixtime + "";
  const date = fromUnixtime.split(" ");
  const month = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
  return date[3] + "/" + month[date[1]] + "/" + date[2];
};

module.exports = {
  wrapAsync,
  authentication,
  getDistanceFromLatLonInKm,
  toTimestamp,
  transferToLatLng,
  toDateFormat
};
