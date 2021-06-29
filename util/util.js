require("dotenv").config();
const axios = require("axios");
const validator = require("validator");
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
      return res.status(401).send({ error: "Unauthorized" });
    }
    accessToken = accessToken.replace("Bearer ", "");
    if (accessToken == "null") {
      return res.status(401).send({ error: "Unauthoized" });
    }
    try {
      const user = jwt.verify(accessToken, TOKEN_SECRET);
      req.user = user;
      const result = await User.getUserDetail(user.email);
      req.user.id = result[0].id;
      if (!result) {
        res.status(403).send({ error: "Forbidden" });
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(403).send({ error: "Forbidden" });
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
  const dateArr = date.split("-");
  const datum = new Date(Date.UTC(dateArr[0], dateArr[1] - 1, dateArr[2]));
  return datum.getTime() / 1000;
};

const transferToLatLng = async (location) => {
  const place = encodeURI(location);
  const { data } = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${place}&key=${GOOGLE_MAP}`);
  const latLon = data.results[0].geometry.location;
  if (data.status !== "OK") {
    return null;
  } else {
    const latLonObj = { lat: latLon.lat, lng: latLon.lng };
    return latLonObj;
  }
};

const toDateFormat = async (fromUnixtime) => {
  fromUnixtime = fromUnixtime + "";
  const date = fromUnixtime.split(" ");
  const month = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
  return date[3] + "/" + month[date[1]] + "/" + date[2];
};

const getCity = async (point) => {
  const { data } = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${point.lat},${point.lng}&language=zh-TW&key=${GOOGLE_MAP}`);
  const addressInfo = (data.plus_code.compound_code).split("台灣")[1];
  let city = "";
  for (let i = 0; i < 3; i++) {
    city += addressInfo[i];
  }
  return city;
};

const getShortestRoute = async (originCity, destinationCity, originCoordinate, destinationCoordinate) => {
  const result = {};
  let originObj = {};
  let min = Infinity;
  // to find out the shortest location in the filtered routes id
  for (const i in originCity) {
    // if it is different routes, create a new object and reset the min
    if (i > 0) {
      if (originCity[i].offered_routes_id !== originCity[i - 1].offered_routes_id) {
        originObj = {};
        min = Infinity;
      }
    }
    const distance = getDistanceFromLatLonInKm(originCoordinate.x, originCoordinate.y,
      originCity[i].coordinate.x, originCity[i].coordinate.y);
    if (distance < min) {
      min = distance;
      originObj.originDis = min;
      result[originCity[i].offered_routes_id] = originObj;
    }
  }
  for (const i in destinationCity) {
    min = Infinity;
    for (const j in destinationCity[i]) {
      const distance = getDistanceFromLatLonInKm(destinationCoordinate.x, destinationCoordinate.y,
        destinationCity[i][j].coordinate.x, destinationCity[i][j].coordinate.y);
      if (distance < min) {
        min = distance;
        result[destinationCity[i][j].offered_routes_id].destinationDis = min;
        result[destinationCity[i][j].offered_routes_id].detail = destinationCity[i][j];
      }
    }
  }
  // to delete the route id with origin but without destination
  for (const i in result) {
    if (!result[i].detail) {
      delete result[i];
    }
  }
  return result;
};

const orderShortestRoute = async (shortestRoute) => {
  const orderRoutes = [];
  for (const i in shortestRoute) {
    const route = [];
    const distance = shortestRoute[i].originDis + shortestRoute[i].destinationDis;
    delete shortestRoute[i].originDis;
    delete shortestRoute[i].destinationDis;
    shortestRoute[i].routeId = i;
    route.push(distance);
    route.push(shortestRoute[i]);
    orderRoutes.push(route);
  }
  orderRoutes.sort((a, b) => {
    return a[0] - b[0];
  });
  return orderRoutes;
};

const dbToDateformat = async (dbResult) => {
  for (const i in dbResult) {
    dbResult[i].date = await toDateFormat(dbResult[i].date);
  }
  return dbResult;
};

const getGooglePhoto = async (place) => {
  place = await trimAddress(place);
  place = encodeURI(place);
  const { data } = await axios.get(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${place}&inputtype=textquery&fields=photos&key=${GOOGLE_MAP}`);
  console.log(data);
  const photo = data.candidates[0].photos[0].photo_reference;
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo}&key=${GOOGLE_MAP}`;
};

const trimAddress = async (address) => {
  address = address.split("台灣")[1];
  let newAddress = "";
  for (let i = 0; i < 6; i++) {
    if (address[i] == undefined) {
      continue;
    }
    newAddress += address[i];
  }
  return newAddress;
};

const checkLogin = () => {
  return async function (req, res, next) {
    try {
      let accessToken = req.get("Authorization");
      let user = "";
      if (accessToken) {
        accessToken = accessToken.replace("Bearer ", "");
        user = await jwt.verify(accessToken, TOKEN_SECRET);
      }
      req.user = user;
      const { query } = req;
      next();
    } catch (err) {
      console.log(err);
    }
  };
};

const verifyreqQuery = () => {
  return async function (req, res, next) {
    try {
      const reqObject = req.query;
      const reqQueryArr = Object.values(reqObject);
      for (const query of reqQueryArr) {
        if (!validator.isInt(query)) {
          return res.status(401).send({ error: "query is not a number" });
        }
      }
      next();
    } catch (err) {
      console.log(err);
    }
  };
};

function isPunctuation (str) {
  const punct = "!,';/<>.-?";
  for (let i = 0; i < str.length; i++) {
    if (!punct.includes(str[i])) {
      continue;
    };
    return true;
  };
  return false;
}

module.exports = {
  wrapAsync,
  authentication,
  getDistanceFromLatLonInKm,
  toTimestamp,
  transferToLatLng,
  toDateFormat,
  getCity,
  getShortestRoute,
  orderShortestRoute,
  dbToDateformat,
  trimAddress,
  getGooglePhoto,
  checkLogin,
  verifyreqQuery,
  isPunctuation
};
