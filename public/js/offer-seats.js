const origin = localStorage.getItem("driverOrigin");
const destination = localStorage.getItem("driverDestination");
const persons = document.getElementById("persons");
const date = document.getElementById("date");
const time = document.getElementById("time");
const next = document.getElementById("next");

window.addEventListener("load", () => {
  console.log("test");
  const url = new URL("http://localhost:3000/path.html");
  const searchParams = new URLSearchParams({ id: 1 });
  url.search = searchParams;
  console.log(url.href);

  initMap();
  const seatsOfferedInfo = {};

  next.addEventListener("click", () => {
    showLoading();
    if (persons.value === "" || date.value === "" || date.value === "") {
      return swal({
        text: "乘載人數、日期、費用為必填",
        icon: "warning"
      });
    }
    seatsOfferedInfo.origin = origin;
    seatsOfferedInfo.destination = destination;
    seatsOfferedInfo.persons = persons.value;
    seatsOfferedInfo.date = date.value;
    seatsOfferedInfo.time = time.value;

    const verifyToken = localStorage.getItem("access_token");
    if (!verifyToken) {
      document.location.href = "./login.html";
    }
    fetch("/api/1.0/offer-seats-info", {
      method: "POST",
      body: JSON.stringify(seatsOfferedInfo),
      headers: new Headers({
        Authorization: "Bearer " + verifyToken,
        "Content-Type": "application/json"
      })
    }).then((response) => {
      return response.json();
    }).catch(error => {
      console.error("Error:", error);
    }).then(response => {
      console.log("Success:", response);
      if (response.error) {
        swal({
          text: response.error,
          icon: "warning"
        });
      } else {
        const data = response.route;
        console.log("data46:", data);
        window.localStorage.setItem("route", JSON.stringify(response.route));
        const url = new URL("http://localhost:3000/path.html");
        const searchParams = new URLSearchParams({
          routeid: data[0].route_id
        });
        url.search = searchParams;
        console.log(url.href);
        document.location.href = `./path.html?routeid=${data[0].route_id}`;
      }
    });
  });
});

let map;
let service;
let infowindow;
const geometry = [];
let counter = 0;
function initMap () {
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

function boundsFit (geometry1, geometry2) {
  const bounds = new google.maps.LatLngBounds();
  console.log(geometry1, geometry2);
  bounds.extend(geometry1);
  bounds.extend(geometry2);
  if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
    const extendPoint1 = new google.maps.LatLng(bounds.getNorthEast().lat() + 0.02, bounds.getNorthEast().lng() + 0.02);
    const extendPoint2 = new google.maps.LatLng(bounds.getNorthEast().lat() - 0.02, bounds.getNorthEast().lng() - 0.02);
    bounds.extend(extendPoint1);
    bounds.extend(extendPoint2);
  }
  map.fitBounds(bounds);
}

const showLoading = function () {
  swal({
    title: "正在計算路程...",
    closeOnEsc: false,
    allowOutsideClick: false,
    buttons: false,
    timer: 10000,
    onOpen: () => {
      swal.showLoading();
    }
  }).then(
    () => {},
    (dismiss) => {
      if (dismiss === "timer") {
        console.log("closed by timer!!!!");
        swal({
          title: "Finished!",
          type: "success",
          timer: 2000,
          showConfirmButton: true
        });
      }
    }
  );
};
