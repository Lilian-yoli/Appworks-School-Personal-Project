require("dotenv").config();
const axios = require("axios");
const { GOOGLE_MAP } = process.env;
const Path = require("../server/models/path_model.js");
const Util = require("./util.js");

// start and destination are pure string lat lng, ex. 25.0329694, 121.5654177
const getDirection = async (start, destination) => {
  try {
    const { data } = await axios.get(`https://maps.googleapis.com/maps/api/directions/json?language=zh-TW&origin=${start}&destination=${destination}&key=${GOOGLE_MAP}`);
    const originLatlon = start.split(",");
    const destinationLatlon = destination.split(",");

    const waypoints = [
      { lat: Number(originLatlon[0]), lng: Number(originLatlon[1]) },
      { lat: Number(destinationLatlon[0]), lng: Number(destinationLatlon[1]) }
    ];
    const routes = data.routes[0];
    for (const latLng of routes.legs[0].steps) {
      waypoints.push(latLng.start_location);
    }
    return waypoints;
  } catch (err) {
    console.log(err);
  }
};

const filterRoutesIn20km = async (start, destination, date, seats) => {
  try {
    const waypoints = await getDirection(start, destination);
    const passengerRoutes = await Path.getPassengerRoutesByDate(date);

    const filterByOrigins = await matchWaypoints(passengerRoutes, waypoints, "origin_coordinate");

    const filterByDestination = await matchWaypoints(filterByOrigins, waypoints, "destination_coordinate");

    const driverOrigin = start.split(",");
    const filteredRoutes = [];
    // check if the direction is the same as driver
    const fianlFilteredRoutes = checkSameDirection(filterByDestination, driverOrigin, filteredRoutes);

    return fianlFilteredRoutes;
  } catch (err) {
    console.log(err);
  }
};

const matchWaypoints = async (passengerRoutes, waypoints, latLng) => {
  try {
    const onRoadPassengers = [];
    const onRoadPassenger = {};
    for (const route of passengerRoutes) {
      const locationLatLng = route[latLng];
      for (const waypoint of waypoints) {
        const distance = Util.getDistanceFromLatLonInKm(waypoint.lat, waypoint.lng, locationLatLng.x, locationLatLng.y);
        const distanceRange = 25;
        if (distance <= distanceRange) {
          const id = route.id;
          if (!onRoadPassenger[id]) {
            onRoadPassenger[id] = route;
            onRoadPassengers.push(route);
            break;
          }
        }
      }
    }
    return onRoadPassengers;
  } catch (err) {
    console.log(err);
  }
};

const checkSameDirection = (routes, driverOrigin, filteredRoutes) => {
  try {
    for (const route of routes) {
      const originLatLng = route.origin_coordinate;
      const destinationLatLng = route.destination_coordinate;
      const originDistance = Util.getDistanceFromLatLonInKm(driverOrigin[0], driverOrigin[1], originLatLng.x, originLatLng.y);
      const destinationDistance = Util.getDistanceFromLatLonInKm(driverOrigin[0], driverOrigin[1], destinationLatLng.x, destinationLatLng.y);

      if (destinationDistance > originDistance) {
        filteredRoutes.push(route);
      }
    }
    return filteredRoutes;
  } catch (err) {
    console.log(err);
  }
};

const sortAllPassengerByDistance = (place) => {
  const allPassengerDistance = [];
  for (const i in place) {
    const originLatLng = place[i].origin_coordinate;
    const destinationLatLng = place[i].destination_coordinate;
    const distance = Util.getDistanceFromLatLonInKm(originLatLng.x, originLatLng.y, destinationLatLng.x, destinationLatLng.y);

    const passengerDistanceArr = [distance, place[i]];
    allPassengerDistance.push(passengerDistanceArr);
  }

  allPassengerDistance.sort((a, b) => {
    return a[0] - b[0];
  });
  allPassengerDistance.reverse();
  return allPassengerDistance;
};

const getWayptsCity = async (waypoints) => {
  try {
    for (const i in waypoints) {
      const city = await Util.getCity(waypoints[i]);
      waypoints[i].city = city;
    }
    return waypoints;
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  getDirection,
  sortAllPassengerByDistance,
  filterRoutesIn20km,
  getWayptsCity
};
