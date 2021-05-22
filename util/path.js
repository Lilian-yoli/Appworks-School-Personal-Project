require("dotenv").config();
const axios = require("axios");
const { GOOGLE_MAP } = process.env;
const Path = require("../server/models/path_model.js");
const Util = require("./util.js");

// start and destination are pure string lat lng, ex. 25.0329694, 121.5654177
const getDirection = async (start, destination) => {
  console.log("test:", start, destination);
  const { data } = await axios.get(`https://maps.googleapis.com/maps/api/directions/json?language=zh-TW&origin=${start}&destination=${destination}&key=${GOOGLE_MAP}`);
  console.log("data.routes[0].bounds", data);
  const originLatlon = start.split(",");
  const destinationLatlon = destination.split(",");

  const waypointObj = {
    start: { lat: Number(originLatlon[0]), lng: Number(originLatlon[1]) },
    destination: { lat: Number(destinationLatlon[0]), lng: Number(destinationLatlon[1]) }
  };
  const routes = data.routes[0];
  for (const i in routes.legs[0].steps) {
    const stepVariables = "step" + i;
    // stepArr.push(routes.legs[0].steps[i].start_location);

    waypointObj[stepVariables] = routes.legs[0].steps[i].start_location;
  }
  // console.log(waypointObj);
  return waypointObj;
};

const filterRoutesIn5km = async (start, destination, date, seats) => {
  const waypoints = await getDirection(start, destination);
  const allPlaces = await Path.getAllplacesByPassengers(date);
  console.log("waypoints", waypoints);
  console.log("allPlaces", allPlaces);
  const filterByOrigins = await matchWaypoints(allPlaces, waypoints, "origin_coordinate");
  console.log("filterByOrigins", filterByOrigins);
  const filterByDestination = await matchWaypoints(filterByOrigins, waypoints, "destination_coordinate");
  console.log("filterByOriginDestinations", filterByDestination);
  const driverOrigin = start.split(",");
  const filterResultArr = [];
  // check if the direction is the same as driver
  for (const i in filterByDestination) {
    const originLatLng = filterByDestination[i].origin_coordinate;
    const destinationLatLng = filterByDestination[i].destination_coordinate;
    const originDistance = await Util.getDistanceFromLatLonInKm(driverOrigin[0], driverOrigin[1], originLatLng.x, originLatLng.y);
    const destinationDistance = await Util.getDistanceFromLatLonInKm(driverOrigin[0], driverOrigin[1], destinationLatLng.x, destinationLatLng.y);
    if (destinationDistance > originDistance) {
      let persons = 0;
      persons += filterByDestination[i].persons;
      if (persons <= seats) { filterResultArr.push(filterByDestination[i]); }
    }
  }
  return filterResultArr;
};

const matchWaypoints = async (passengerLocations, waypoints, latLng) => {
  const onRoadPassenger = [];
  const onRoadPassengerObj = {};
  for (const i in passengerLocations) {
    const locationLatLng = passengerLocations[i][latLng];
    for (const j in waypoints) {
      const distance = await Util.getDistanceFromLatLonInKm(waypoints[j].lat, waypoints[j].lng, locationLatLng.x, locationLatLng.y);
      console.log("distance", distance);
      if (distance <= 10) {
        const id = passengerLocations[i].route_id;
        if (!onRoadPassengerObj[id]) {
          onRoadPassengerObj[id] = passengerLocations[i];
          console.log("onRoadPassengerObj", onRoadPassengerObj);
          onRoadPassenger.push(passengerLocations[i]);
        }
      }
    }
  }
  console.log("onRoadPassenger", onRoadPassenger);
  return onRoadPassenger;
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

module.exports = {
  getDirection,
  sortAllPassengerByDistance,
  filterRoutesIn5km
};
