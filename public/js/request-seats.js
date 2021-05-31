const verifyToken = localStorage.getItem("access_token");
const origin = localStorage.getItem("origin");
console.log(origin, typeof (origin));
const destination = localStorage.getItem("destination");
if (!verifyToken) {
  document.location.href = "./login.html";
}

const persons = document.getElementById("persons");
const date = document.getElementById("date");
const next = document.getElementById("next");

const seatsRequestInfo = {};
window.onload = function () {
  // initMap();
  next.addEventListener("click", () => {
    seatsRequestInfo.origin = origin;
    seatsRequestInfo.destination = destination;
    seatsRequestInfo.persons = persons.value;
    seatsRequestInfo.date = date.value;

    fetch("/api/1.0/request-seats-info", {
      method: "POST",
      body: JSON.stringify(seatsRequestInfo),
      headers: new Headers({
        Authorization: "Bearer " + verifyToken,
        "Content-Type": "application/json"
      })
    }).then((response) => {
      console.log(123);
      return response.json();
    }).catch(error => console.error("Error:", error))
      .then(response => {
        console.log("Success:", response);
        if (!response.error) {
          document.location.href = "./passenger-request-detail.html";
        } else {
          alert("行程重複輸入");
        }
      });
  });
  console.log(origin, destination);
};

let map;
let service;
let infowindow;
const geometry = [];
let counter = 0;
async function initMap () {
  const taiwan = new google.maps.LatLng(23.69781, 120.960515);

  map = new google.maps.Map(document.getElementById("map"), {
    center: taiwan,
    zoom: 7
  });
  const originQuery = {
    query: origin,
    fields: ["name", "geometry", "place_id"]
  };
  const destinationQuery = {
    query: destination,
    fields: ["name", "geometry", "place_id"]
  };
  findPlace(originQuery);
  findPlace(destinationQuery);
}

function createMarker (place, address) {
  if (!place.geometry || !place.geometry.location) return;
  const marker = new google.maps.Marker({
    map,
    position: place.geometry.location
  });

  infowindow = new google.maps.InfoWindow({
    content: address
  });
  infowindow.open(map, marker);
}

function findPlace (request) {
  counter++;
  service = new google.maps.places.PlacesService(map);
  service.findPlaceFromQuery(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
      console.log(counter);
      createMarker(results[0], request.query);
      // map.setCenter(results[0].geometry.location);
      console.log(results[0].geometry.location);
      geometry.push(results[0].geometry.location);
      if (counter > 1) {
        console.log(geometry[0], geometry[1]);
        boundsFit(geometry[0], geometry[1]);
      }
    }
  });
}

function boundsFit (geometry1, geometry2) {
  const bounds = new google.maps.LatLngBounds();
  console.log(geometry1, geometry2);
  bounds.extend(geometry1);
  bounds.extend(geometry2);
  if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
    const extendPoint1 = new google.maps.LatLng(bounds.getNorthEast().lat() + 0.01, bounds.getNorthEast().lng() + 0.01);
    const extendPoint2 = new google.maps.LatLng(bounds.getNorthEast().lat() - 0.01, bounds.getNorthEast().lng() - 0.01);
    bounds.extend(extendPoint1);
    bounds.extend(extendPoint2);
  }
  map.fitBounds(bounds);
}
