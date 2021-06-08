
const query = window.location.search;
localStorage.setItem("index", 0);

async function wrapper () {
  const response = await fetch(`/api/1.0/passenger-route-suggestion${query}`, {
    method: "GET",
    headers: new Headers({
      Authorization: "Bearer " + verifyToken,
      "Content-Type": "application/json"
    })
  });
  const data = await response.json();
  console.log("data", data);
  const passenger = data.passengerInfo;
  const driver = data.driverInfo;
  const waypts = [];
  if (data.msg) {
    const pathSuggestion = document.getElementById("driver-route");
    pathSuggestion.append(Object.assign(document.createElement("h1"),
      { id: "sign" },
      { textContent: "尚無合適路線，已儲存需求" }));
    pathSuggestion.append(Object.assign(document.createElement("img"),
      { id: "sign-pic" },
      { src: "../uploads/images/passenger_nosuitable_route.svg" }));
    pathSuggestion.append(Object.assign(document.createElement("form"),
      { action: "./" },
      { id: "back" }));
    const back = document.getElementById("back");
    back.append(Object.assign(document.createElement("input"),
      { type: "submit" },
      { value: "回首頁" }));
    const map = document.getElementById("map");
    map.style.display = "none";
  } else {
    document.getElementById("driver-route").innerHTML =
    `<h3>起點：${passenger.origin}</h3><h3>終點：${passenger.destination}</h3>`;
    for (const i in driver) {
      const pathSuggestion = document.getElementById("path-suggestion");
      pathSuggestion.innerHTML += `<li>車主${+i + 1}: <br>起點：${driver[i][1].detail.origin} <br>
        終點：${driver[i][1].detail.destination} ｜ 人數：${driver[i][1].detail.seats_left}人</li>
        <button class="add btn" id="${i}.0" >+</button> 
        <li><img src="${driver[i][1].detail.picture}"></li><li>${driver[i][1].detail.name}</li>
        <button class="btn" id="contact">聯繫車主</button>`;
      console.log(pathSuggestion);
    }
  }

  const driverOrigin = driver[0][1].detail.origin;
  const driverDestination = driver[0][1].detail.destination;

  waypts.push({
    location: { lat: passenger.origin_coordinate.x, lng: passenger.origin_coordinate.y },
    stopover: true
  });
  waypts.push({
    location: { lat: passenger.destination_coordinate.x, lng: passenger.destination_coordinate.y },
    stopover: true
  });

  showPickedPassenger(driver, 0, 0);
  initMap(waypts, driverOrigin, driverDestination, true, driver);
  chooseWypts(driver, waypts);
  deduct();
  clickEvent(driver, passenger);
  // matchedBtn(driver, passenger, verifyToken, query);
  skipBtn();
}

function initMap (waypts, driverOrigin, driverDestination, isDirection, driver) {
  if (!waypts) {
    return;
  }
  const originCoordinate = driverOrigin;
  const destinationCoordinate = driverDestination;

  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true });
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 8,
    center: { lat: 25.0, lng: 121.585 }
  });

  directionsRenderer.setMap(map);

  const request = {
    origin: `${originCoordinate}`,
    destination: `${destinationCoordinate}`,
    waypoints: waypts,
    optimizeWaypoints: true,
    travelMode: "DRIVING"
  };
  if (!isDirection) {
    return;
  }

  // 繪製兩點的路線
  // directionsService.route(request, function (result, status) {
  //   if (status == "OK") {
  //     directionsRenderer.setDirections(result);
  //   } else {
  //     console.log(status);
  //   }
  // });
  const icons = {
    start: new google.maps.MarkerImage(
      // URL
      "../../uploads/images/logo.png",
      // (width,height)
      new google.maps.Size(44, 32)
      // The origin point (x,y)
      // new google.maps.Point(0, 0),
      // // The anchor point (x,y)
      // new google.maps.Point(22, 32)
    ),
    end: new google.maps.MarkerImage(
      // URL
      "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png",
      // (width,height)
      new google.maps.Size(44, 32),
      // The origin point (x,y)
      new google.maps.Point(0, 0),
      // The anchor point (x,y)
      new google.maps.Point(22, 32)
    )
  };

  directionsService.route(request, function (response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsRenderer.setDirections(response);

      console.log(response, response.routes[0].legs[1].start_location);

      const wayptsOrigin = new google.maps.LatLng(waypts[0].location);
      let marker = new google.maps.Marker({
        map: map,
        title: "title",
        label: "起點"
      });
      marker.setPosition(wayptsOrigin);
      const index = localStorage.getItem("index");
      const origin = { lat: driver[index][1].detail.origin_coordinate.x, lng: driver[index][1].detail.origin_coordinate.y };
      marker = new google.maps.Marker({
        map: map,
        title: "title",
        position: new google.maps.LatLng(origin)
      });

      const destination = { lat: driver[index][1].detail.destination_coordinate.x, lng: driver[index][1].detail.destination_coordinate.y };
      marker = new google.maps.Marker({
        map: map,
        title: "title",
        position: new google.maps.LatLng(destination)
      });

      const wayptsDestination = new google.maps.LatLng(waypts[1].location);
      marker = new google.maps.Marker({
        map: map,
        title: "title",
        label: "終點"
      });
      marker.setPosition(wayptsDestination);
    }
  });

  // const infowindow = new google.maps.InfoWindow();

  // let marker;

  // for (let i = 0; i < waypts.length; i++) {
  //   marker = new google.maps.Marker({
  //     position: new google.maps.LatLng(waypts[i].location.lat, waypts[i].location.lng),
  //     map: map
  //   });

  //   google.maps.event.addListener(marker, "click", (function (marker, i) {
  //     return function () {
  //       infowindow.setContent(123);
  //       infowindow.open(map, marker);
  //     };
  //   })(marker, i));
  // }
}

function chooseWypts (driver, waypts) {
  for (const i in driver) {
    const add = document.querySelectorAll(".add")[i];
    add.addEventListener("click", (e) => {
      const index = localStorage.getItem("index");
      const numInfo = (e.target.id).split(".");
      const num = numInfo[0];
      console.log("num", num);
      e.preventDefault();
      if (num != index) {
        const driverOrigin = driver[num][1].detail.origin;
        const driverDestination = driver[num][1].detail.destination;
        localStorage.setItem("index", num);
        initMap(waypts, driverOrigin, driverDestination, true, driver);
        showPickedPassenger(driver, num, numInfo[1]);
        deduct();
      }
    });
  }
}

function deduct () {
  const deduct = document.querySelector(".deduct");
  deduct.addEventListener("click", () => {
    const pickedDriver = document.getElementById("picked-passenger");
    pickedDriver.innerHTML = "";
    localStorage.setItem("index", -1);
    initMap([], 0, 0, false, 0);
    showPickedPassenger(null, null, 1);
  });
}

function showPickedPassenger (driver, num, numInfo) {
  console.log(num);
  const pickedDriver = document.getElementById("picked-passenger");
  pickedDriver.innerHTML = "";
  if (numInfo == 0) {
    console.log(123);
    pickedDriver.innerHTML = `<h3>已選擇的車主：</h3><li>車主${+num + 1}:<br> 起點：${driver[num][1].detail.origin} <br>
    終點：${driver[num][1].detail.destination} ｜ 人數：${driver[num][1].detail.seats_left}人</li>
    <button class="btn deduct" id="${num}.1">-</button>
    <li><img src="${driver[num][1].detail.picture}"></li><li>${driver[num][1].detail.name}</li> `;
  }
}

const clickEvent = async (driver, passenger) => {
  let data = "";
  const index = localStorage.getItem("index");

  const res = await fetch("/api/1.0/verify", {
    method: "POST",
    body: JSON.stringify({
      receiverId: driver[index][1].detail.user_id
    }),
    headers: new Headers({
      Authorization: "Bearer " + verifyToken,
      "Content-Type": "application/json"
    })
  });
  data = await res.json();
  console.log("verifyAPI:", data);

  const contact = document.getElementById("contact");
  contact.addEventListener("click", async () => {
    const room = makeRooom(data.userId, data.receiverId);
    document.location.href = `./chat.html?room=${room}`;
  });

  const book = document.getElementById("apply-route");
  book.addEventListener("click", async () => {
    const response = await fetch("/api/1.0/passenger-tour", {
      method: "POST",
      body: JSON.stringify({
        driverRouteId: driver[index][1].detail.offered_routes_id,
        persons: passenger.persons,
        date: passenger.date,
        passengerRouteId: passenger.route_id
      }),
      headers: new Headers({
        Authorization: "Bearer " + verifyToken,
        "Content-type": "application/json"
      })
    });
    const idInfo = await response.json();
    if (idInfo.error) {
      return alert("當日路線已建立，請至「你的行程」查看");
    }
    console.log(idInfo);
    console.log(idInfo.tourId);
    const routeInfo = {
      receiverId: [driver[index][1].detail.user_id],
      passengerRouteId: null,
      url: `./driver-tour-info.html?routeid=${driver[index][1].detail.offered_routes_id}&tour=${idInfo.tourId}`,
      content: `乘客${data.username}已接受你的行程，立即前往查看`,
      type: "match",
      icon: "./uploads/images/member.png",
      confirm: 0
    };
    socket.emit("notifiyPassenger", routeInfo);
    alert("通知已傳送");

    document.location.href = "./";
  });
};
// socket send notification
// function matchedBtn (driver, passenger, verifyToken, query) {
//   const applyRoute = document.querySelectorAll(".button")[0];
//   const passengerRouteId = [];
//   applyRoute.addEventListener("click", async () => {
//     const index = (localStorage.getItem("index")).split(",");

//     const passengerId = [];
//     for (const i in index) {
//       if (index[i] % 2 == 0) {
//         passengerRouteId.push(passenger[index[i] / 2].route_id);
//         passengerId.push(passenger[index[i] / 2].user_id);
//       }
//     }
//     const routeInfo = {
//       receiverId: passengerId,
//       passengerRouteId: passengerRouteId,
//       url: `./passenger-search-detail.html?id=${driver.routeId}`,
//       content: `車主${driver.name}已接受你的行程，立即前往查看`,
//       type: "match",
//       icon: "./uploads/images/member.png"
//     };
//     console.log(123);
//     socket.emit("notifiyPassenger", routeInfo);
//     alert("通知已傳送");
//     localStorage.setItem("passengerRoute", passengerRouteId);
//     localStorage.removeItem("waypts");
//     const res = await fetch("/api/1.0/driver-tour", {
//       method: "POST",
//       body: JSON.stringify({ driverRouteId: driver.routeId, passengerRouteId: passengerRouteId }),
//       headers: new Headers({
//         Authorization: "Bearer " + verifyToken,
//         "Content-Type": "application/json"
//       })
//     });
//     const data = await res.json();
//     console.log(data);
//     document.location.href = `./driver-itinerary-detail.html${query}`;
//   });
// }

function skipBtn () {
  const skipRoute = document.querySelectorAll(".button")[1];
  skipRoute.addEventListener("click", () => {
    alert("路線已儲存");
    document.location.href = "./";
  });
}
