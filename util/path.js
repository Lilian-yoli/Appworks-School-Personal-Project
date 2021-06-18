require("dotenv").config();
const axios = require("axios");
const { GOOGLE_MAP } = process.env;
const Path = require("../server/models/path_model.js");
const Util = require("./util.js");

// start and destination are pure string lat lng, ex. 25.0329694, 121.5654177
const getDirection = async (start, destination) => {
  console.log("test:", start, destination);
  try {
    const { data } = await axios.get(`https://maps.googleapis.com/maps/api/directions/json?language=zh-TW&origin=${start}&destination=${destination}&key=${GOOGLE_MAP}`);
    console.log("data.routes[0].bounds", data);
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

const filterRoutesIn5km = async (start, destination, date, seats) => {
  try {
    const waypoints = await getDirection(start, destination);
    const passengerRoutes = await Path.getPassengerRoutesByDate(date);
    console.log("waypoints", waypoints);
    console.log("passengerRoutes", passengerRoutes);
    const filterByOrigins = await matchWaypoints(passengerRoutes, waypoints, "origin_coordinate");
    console.log("filterByOrigins", filterByOrigins);
    const filterByDestination = await matchWaypoints(filterByOrigins, waypoints, "destination_coordinate");
    console.log("filterByOriginDestinations", filterByDestination);
    const driverOrigin = start.split(",");
    const filteredRoutes = [];
    // check if the direction is the same as driver
    const fianlFilteredRoutes = checkSameDirection(filterByDestination, driverOrigin, filteredRoutes);
    console.log(fianlFilteredRoutes);
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
        console.log("distance", distance);
        if (distance <= 20) {
          const id = route.route_id;
          if (!onRoadPassenger[id]) {
            onRoadPassenger[id] = route;
            console.log("onRoadPassenger", onRoadPassenger);
            onRoadPassengers.push(route);
          }
        }
      }
    }
    console.log("onRoadPassenger", onRoadPassengers);
    return onRoadPassengers;
  } catch (err) {
    console.log(err);
  }
};

const checkSameDirection = (routes, driverOrigin, filteredRoutes) => {
  for (const route of routes) {
    const originLatLng = route.origin_coordinate;
    const destinationLatLng = route.destination_coordinate;
    const originDistance = Util.getDistanceFromLatLonInKm(driverOrigin[0], driverOrigin[1], originLatLng.x, originLatLng.y);
    const destinationDistance = Util.getDistanceFromLatLonInKm(driverOrigin[0], driverOrigin[1], destinationLatLng.x, destinationLatLng.y);
    console.log("*******", originDistance, destinationDistance);
    if (destinationDistance > originDistance) {
      filteredRoutes.push(route);
    }
  }
  return filteredRoutes;
};

const sortAllPassengerByDistance = (place) => {
  console.log(typeof (place));
  console.log(place[0]);
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

const getPlaceId = async (origin, destination) => {
  const originEncode = encodeURI(origin);
  const destinationEncode = encodeURI(destination);
  const originId = await axios.get(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?key=${GOOGLE_MAP}&input=${originEncode}&inputtype=textquery`);
  const destinationId = await axios.get(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?key=${GOOGLE_MAP}&input=${destinationEncode}&inputtype=textquery`);
  const result = { origin: originId.data.candidates[0].place_id, destination: destinationId.data.candidates[0].place_id };
  return result;
};

const getWayptsCity = async (waypoints) => {
  console.log(waypoints[0].lat, waypoints[0].lng);
  for (const i in waypoints) {
    const city = await Util.getCity(waypoints[i]);
    console.log(city);
    waypoints[i].city = city;
  }
  console.log("getCounty", waypoints);
  return waypoints;
};

module.exports = {
  getDirection,
  sortAllPassengerByDistance,
  filterRoutesIn5km,
  getPlaceId,
  getWayptsCity
};
