require("dotenv").config();
const axios = require("axios");
const { GOOGLE_MAP } = process.env;
const Path = require("../server/models/path_model.js");
const Util = require("./util.js");

const getDirection = async (start, destination) => {
  console.log("test:", start, destination);
  const { data } = await axios.get(`https://maps.googleapis.com/maps/api/directions/json?language=zh-TW&origin=${start}&destination=${destination}&key=${GOOGLE_MAP}`);
  //   console.log("data.routes[0].bounds", data.routes[0].legs[0].steps);
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

const filterRoutesIn5km = async (start, destination, date, time) => {
  const waypoints = await getDirection(start, destination);
  const allPlaces = await Path.getAllplacesByPassengers(date);
  console.log("waypoints", waypoints);
  console.log("allPlaces", allPlaces);
  const onRoadPassenger = [];
  const onRoadPassengerObj = {};
  for (const i in allPlaces) {
    if (allPlaces[i].time == time) {
      const placesOriginLatLng = JSON.parse(allPlaces[i].origin_lat_lon);
      const placesDestinationLatLng = JSON.parse(allPlaces[i].destination_lat_lon);

      for (const j in waypoints) {
        const distanceOrigin = Util.getDistanceFromLatLonInKm(waypoints[j].lat, waypoints[j].lng, placesOriginLatLng.lat, placesOriginLatLng.lng);
        // eslint-disable-next-line max-len
        const distanceDestinatin = Util.getDistanceFromLatLonInKm(waypoints[j].lat, waypoints[j].lng, placesDestinationLatLng.lat, placesDestinationLatLng.lng);
        console.log("distance", distanceOrigin, distanceDestinatin);
        if (distanceOrigin <= 5) {
          const id = allPlaces[i].route_id;
          if (!onRoadPassengerObj[id]) {
            onRoadPassengerObj[id] = allPlaces[i];
            console.log("onRoadPassengerObj", onRoadPassengerObj);
            onRoadPassenger.push(allPlaces[i]);
          }
        }
      }
    }
  }
  console.log("onRoadPassenger", onRoadPassenger);
  return onRoadPassenger;
};

const sortAllPassengerByDistance = (place) => {
  // eslint-disable-next-line max-len
  // const place = { passenger1: { route: [[24.518504, 121.831112], [25.044311, 121.58174]] }, passenger2: { route: [[24.748217, 121.748611], [24.467832, 121.747473]] }, passenger3: { route: [[24.463778, 121.800613], [23.982576, 121.613073]] } };
  console.log(typeof (place));
  console.log(place[0]);
  const allPassengerDistance = [];
  for (const i in place) {
    const originLatLng = JSON.parse(place[i].origin_lat_lon);
    const destinationLatLng = JSON.parse(place[i].destination_lat_lon);
    const distance = Util.getDistanceFromLatLonInKm(originLatLng.lat, originLatLng.lng, destinationLatLng.lat, destinationLatLng.lng);

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
