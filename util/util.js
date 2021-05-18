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
    const latLonObj = { lat: latLon.lat, lng: latLon.lng };
    return JSON.stringify(latLonObj);
  }
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

// const getDirection = async (start, destination) => {
//   const { data } = await axios.get(`https://maps.googleapis.com/maps/api/directions/json?language=zh-TW&origin=${start}&destination=${destination}&key=${GOOGLE_MAP}`);
//   // console.log(data.routes[0].bounds);
//   const startArr = [];
//   const destinationArr = [];
//   const routes = data.routes[0];
//   startArr.push(routes.bounds.northeast.lat);
//   startArr.push(routes.bounds.northeast.lng);
//   destinationArr.push(routes.bounds.southwest.lat);
//   destinationArr.push(routes.bounds.southwest.lng);
//   // console.log(startArr, destinationArr);

//   const waypointObj = { start: startArr, destination: destinationArr };
//   for (const i in routes.legs[0].steps) {
//     const stepArr = [];
//     const stepVariables = "step" + i;
//     stepArr.push(routes.legs[0].steps[i].start_location.lat);
//     stepArr.push(routes.legs[0].steps[i].start_location.lng);
//     waypointObj[stepVariables] = stepArr;
//   }
//   // console.log(waypointObj);
//   return waypointObj;
// };

// const filterRoutesIn5km = async (start, destination) => {
//   const waypoints = await getDirection(start, destination);
//   const allPlaces = await Path.getAllplacesByPassengers();
//   console.log("waypoints", waypoints);
//   console.log("allPlaces", allPlaces);
//   const onRoadPassenger = [];
//   const onRoadLocation = {};
//   for (const i in allPlaces) {
//     for (const j in waypoints) {
//       const distance = getDistanceFromLatLonInKm(waypoints[j], allPlaces[i].route[0]);
//       if (distance <= 5) {
//         if (!onRoadLocation[i]) {
//           onRoadLocation[i] = allPlaces[i].route;
//         }
//       }
//     }
//   }
//   onRoadPassenger.push(onRoadLocation);
//   console.log("onRoadPassenger", onRoadPassenger);
//   return onRoadPassenger;
// };

// const sortAllPassengerByDistance = (place) => {
//   // eslint-disable-next-line max-len
//   // const place = { passenger1: { route: [[24.518504, 121.831112], [25.044311, 121.58174]] }, passenger2: { route: [[24.748217, 121.748611], [24.467832, 121.747473]] }, passenger3: { route: [[24.463778, 121.800613], [23.982576, 121.613073]] } };
//   const allPassengerDistance = [];
//   for (const i in place[0]) {
//     const distance = getDistanceFromLatLonInKm(place[0][i][0], place[0][i][1]);
//     const passengerInfo = [i, distance, place[0][i][0], place[0][i][1]];
//     allPassengerDistance.push(passengerInfo);
//   }

//   allPassengerDistance.sort((a, b) => {
//     return a[1] - b[1];
//   });
//   allPassengerDistance.reverse();
//   return allPassengerDistance;
// };

module.exports = {
  wrapAsync,
  authentication,
  transferToLatLng,
  getDistanceFromLatLonInKm
};
