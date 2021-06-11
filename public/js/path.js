const socket = io();

async function wrapper () {
  const query = window.location.search;
  const verifyToken = localStorage.getItem("access_token");

  const response = await fetch(`/api/1.0/route-suggestion${query}`, {
    method: "GET",
    headers: new Headers({
      Authorization: "Bearer " + verifyToken,
      "Content-Type": "application/json"
    })
  });
  const data = await response.json();
  console.log("data", data);
  const driver = data.driverInfo;
  const passenger = data.passengerInfo;
  const index = [];
  const pickedWaypts = [];
  const passengerArr = [];
  const dict = {};

  socket.emit("login", driver.id);

  if (passenger.length < 1) {
    const pathSuggestion = document.getElementById("path-suggestion");
    console.log(pathSuggestion);
    pathSuggestion.append(Object.assign(document.createElement("h1"),
      { id: "sign" },
      { textContent: "尚無合適乘客" }));
    pathSuggestion.append(Object.assign(document.createElement("img"),
      { id: "sign-pic" },
      { src: "../uploads/images/no-path-suggestion.svg" }));
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
    const myRoute = document.getElementById("my-route");
    myRoute.innerHTML +=
  `<h2 id="my-title">你的路線</h2>
  <div id="my-wrapper">
      <div id="my-origin">起點：${driver.origin}</div>
      <div id="my-destination">終點：${driver.destination}</div>
      <div class="my-detail">
          <div id="my-date">日期：${driver.date}</div>
          <div id="my-time">時間：${driver.time}</div>
          <div id="my-seats">${driver.seats_left}個座位</div>
      </div>
  </div>`;

    let personCounter = 0;
    for (let i = 0; i < passenger.length; i++) {
      personCounter += passenger[i].persons;
      // if seats enough, add waypts
      if (personCounter <= driver.seats_left) {
        const originObj = { lat: passenger[i].origin_coordinate.x, lng: passenger[i].origin_coordinate.y };
        const destinationObj = { lat: passenger[i].destination_coordinate.x, lng: passenger[i].destination_coordinate.y };
        pickedWaypts.push(originObj);
        pickedWaypts.push(destinationObj);
        index[i] = i;
        passengerArr.push(passenger[i].route_id);
      }
      const originObj = { lat: passenger[i].origin_coordinate.x, lng: passenger[i].origin_coordinate.y };
      const destinationObj = { lat: passenger[i].destination_coordinate.x, lng: passenger[i].destination_coordinate.y };
      dict[i * 2] = originObj;
      dict[i * 2 + 1] = destinationObj;

      const pathSuggestion = document.getElementById("path-suggestion");
      pathSuggestion.innerHTML +=
      `<div class="suggestion-wrapper">
          <div class="suggestion-upper">
              <img class="suggestion-img-img" src="./uploads/images/route.png">
              <div class="suggestion-location">
                  <div class="suggestion-origin">${passenger[i].origin}</div>
                  <div class="suggestion-destination">${passenger[i].destination}</div>
              </div>
              <div class="suggestion-option">
                  <img class="suggestion-add" id=${i} src="./uploads/images/graycheck.png">
              </div>     
          </div>
          <div class="under">
              <img class="profile" src="${passenger[i].picture}">
              <div class="name">${passenger[i].name}</div>
              <div class="persons">${passenger[i].persons}人</div>
              <div class="btn-wrap"><button class="contact">聯繫乘客</button></div>
          </div>                        
      </div>`;
      console.log(pathSuggestion);
    };
    const pathSuggestion = document.getElementById("path-suggestion");
    const title = document.createElement("h2");
    title.className = "suggestion-title";
    title.textContent = "推薦乘客";
    pathSuggestion.insertBefore(title, pathSuggestion.firstChild);
    localStorage.setItem("index", index);
    console.log("index,passengerArr", dict, index, passengerArr);
    showPickedPassenger(index);

    initMap(driver, pickedWaypts);
    chooseWypts(passenger, driver, pickedWaypts, dict, passengerArr, query, verifyToken);
    matchedBtn(driver, passenger, verifyToken, query);
    skipBtn(query);
  }
}

function initMap (driver, pickedWaypts) {
  const waypts = [];
  const originCoordinate = driver.origin;
  const destinationCoordinate = driver.destination;
  pickedWaypts.forEach((loc) => {
    waypts.push({ location: loc, stopover: true });
  });
  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer();
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

  // 繪製兩點的路線
  directionsService.route(request, function (result, status) {
    if (status == "OK") {
      directionsRenderer.setDirections(result);
    } else {
      console.log(status);
    }
  });
}

// function clickButton (query, passengerArr, verifyToken, driver) {
//   const applyRoute = document.querySelectorAll(".button")[0];
//   const skipRoute = document.querySelectorAll(".button")[1];
//   const offeredRouteId = query.split("=");
//   const matchedPassengers = { passengerRouteId: passengerArr, passengerType: "request", offeredRouteId: offeredRouteId[1] };
//   applyRoute.addEventListener("click", () => {
//     fetch("/api/1.0/matched-passengers", {
//       method: "POST",
//       body: JSON.stringify(matchedPassengers),
//       headers: new Headers({
//         Authorization: "Bearer " + verifyToken,
//         "Content-Type": "application/json"
//       })
//     }).then((response) => {
//       return response.json();
//     }).catch(error => {
//       console.error("Error:", error);
//     }).then(response => {
//       console.log("Success:", response);
//       document.location.href = `driver-itinerary-detail.html${query}`;
//     });
//   });
//   skipRoute.addEventListener("click", () => {
//     document.location.href = `driver-itinerary.html${query}`;
//   });
// }

function chooseWypts (passenger, driver, pickedWaypts, dict) {
  for (let i = 0; i < passenger.length; i++) {
    const add = document.querySelectorAll(".suggestion-add")[i];
    add.addEventListener("click", (e) => {
      let index = localStorage.getItem("index");
      console.log("index", index);
      if (index.length < 1) {
        index = [];
      }
      const num = e.target.id;
      e.preventDefault();
      const newIndex = [];
      const passengerArr = [];

      const persons = countCurrentPersons(passenger, index);
      pickedWaypts = [];
      console.log("index", num, index);
      if (index.indexOf(num.toString()) == -1) {
        if (persons + passenger[num].persons > driver.seats_left) {
          swal({
            text: "選擇人數超過可提供座位",
            type: "warning"
          });
        } else {
          index.push(num.toString());
        }
        for (const j in index) {
          pickedWaypts.push(dict[index[j] * 2]);
          pickedWaypts.push(dict[index[j] * 2 + 1]);
          console.log("index[j]", index[j]);
          passengerArr.push(passenger[index[j]].route_id);
        }
        console.log("localStorage.setItem", index);
        console.log("result", pickedWaypts, passengerArr);
        localStorage.setItem("index", index);
        initMap(driver, pickedWaypts);
        showPickedPassenger(passenger, index);
      } else {
        if (persons == 0) {
          swal({
            text: "未選擇乘客",
            type: "warning"
          });
        }
      }
    });
  }
}

function countCurrentPersons (passenger, index) {
  let counter = 0;
  for (const i in index) {
    console.log("Number(index[i])", Number(index[i]));
    console.log("passenger[num].persons", passenger[index[i]].persons, counter);
    counter += passenger[index[i]].persons;
  }
  console.log("countCurrentPersons", counter);
  return counter;
}

function showPickedPassenger (index) {
  const newIndex = [];
  console.log(index);
  for (let i = 0; i < index.length; i++) {
    const pickedPassenger = document.getElementsByClassName("suggestion-wrapper")[index[i]];
    const add = document.getElementsByClassName("suggestion-add")[index[i]];
    if (pickedPassenger.backgroundColor == "rgba(77, 255, 77, 0.4)") {
      pickedPassenger.backgroundColor = "white";
      add.src = "./uploads/images/graycheck.png";
      newIndex.push(index[i]);
    } else {
      pickedPassenger.backgroundColor = "#25FD98";
      add.src = "./uploads/images/check.png";
    }
  }
  localStorage.setItem("index", newIndex);
}

// socket send notification
function matchedBtn (driver, passenger, verifyToken, query) {
  const applyRoute = document.getElementById("apply-route");
  const passengerRouteId = [];
  applyRoute.addEventListener("click", async () => {
    const index = localStorage.getItem("index");

    const passengerId = [];
    for (const i in index) {
      passengerRouteId.push(passenger[index[i]].route_id);
      passengerId.push(passenger[index[i]].user_id);
    }

    localStorage.setItem("passengerRoute", passengerRouteId);
    localStorage.removeItem("waypts");
    const res = await fetch("/api/1.0/driver-tour", {
      method: "POST",
      body: JSON.stringify({ driverRouteId: driver.routeId, passengerRouteId: passengerRouteId }),
      headers: new Headers({
        Authorization: "Bearer " + verifyToken,
        "Content-Type": "application/json"
      })
    });
    const data = await res.json();
    console.log(data);
    const routeInfo = {
      receiverId: passengerId,
      passengerRouteId: passengerRouteId,
      url: `./passenger-tour-info.html?id=${driver.routeId}?tour=${data.tourId}`,
      content: `車主${driver.name}已接受你的行程，立即前往查看`,
      type: "match",
      icon: "./uploads/images/member.png"
    };
    console.log(123);
    socket.emit("notifiyPassenger", routeInfo);
    swal({
      text: "選擇人數超過可提供座位",
      type: "success"
    });
    document.location.href = "./";
  });
}

function skipBtn (query) {
  const skipRoute = document.getElementById("skip");
  skipRoute.addEventListener("click", () => {
    swal({
      text: "路線已儲存",
      type: "success"
    });
    document.location.href = "./";
  });
}
