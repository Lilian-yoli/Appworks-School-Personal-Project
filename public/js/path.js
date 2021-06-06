const socket = io("ws://18.116.17.255/", { transports: ["websocket"] });
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
  }
  document.getElementById("driver-route").innerHTML =
    `<h3>起點：${driver.origin}</h3><h3>終點：${driver.destination}</h3>`;
  let personCounter = 0;
  for (let i = 0; i < passenger.length; i++) {
    personCounter += passenger[i].persons;
    // if seats enough, add waypts
    if (personCounter <= driver.seats_left) {
      const originObj = { lat: passenger[i].origin_coordinate.x, lng: passenger[i].origin_coordinate.y };
      const destinationObj = { lat: passenger[i].destination_coordinate.x, lng: passenger[i].destination_coordinate.y };
      pickedWaypts.push(originObj);
      pickedWaypts.push(destinationObj);
      index[i * 2] = i * 2;
      index[i * 2 + 1] = i * 2 + 1;
      passengerArr.push(passenger[i].route_id);
    }
    const originObj = { lat: passenger[i].origin_coordinate.x, lng: passenger[i].origin_coordinate.y };
    const destinationObj = { lat: passenger[i].destination_coordinate.x, lng: passenger[i].destination_coordinate.y };
    dict[i * 2] = originObj;
    dict[i * 2 + 1] = destinationObj;

    const pathSuggestion = document.getElementById("path-suggestion");
    pathSuggestion.innerHTML += `<li>乘客${i + 1}: ${passenger[i].origin} 到 <br>
        ${passenger[i].destination} ｜ 人數：${passenger[i].persons}人</li>
        <button class="btn" id="${i}.0" >+</button> <button class="btn" id="${i}.1">-</button>`;
    console.log(pathSuggestion);
  };
  localStorage.setItem("index", index);
  console.log("index,passengerArr", dict, index, passengerArr);
  showPickedPassenger(passenger, index);

  initMap(driver, pickedWaypts);
  chooseWypts(passenger, driver, pickedWaypts, dict, passengerArr, query, verifyToken);
  matchedBtn(driver, passenger, verifyToken, query);
  skipBtn(query);
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
  for (let i = 0; i < passenger.length * 2; i++) {
    const btn = document.querySelectorAll(".btn")[i];
    btn.addEventListener("click", (e) => {
      let index = localStorage.getItem("index");
      if (index.length > 0) {
        index = index.split(",");
      } else {
        index = [];
      }
      e.preventDefault();
      const newIndex = [];
      const passengerArr = [];
      const numInfo = (e.target.id).split(".");
      const num = numInfo[0] * 2;
      const persons = countCurrentPersons(passenger, index);
      pickedWaypts = [];
      console.log("num, index", num, index);
      if (numInfo[1] != 1) {
        if (index.indexOf(num.toString()) == -1) {
          if (index.indexOf((num + 1).toString()) == -1) {
            if (persons + passenger[num / 2].persons > driver.seats_left) {
              alert("人數超過可提供空位");
            } else {
              index.push(num.toString());
              index.push((num + 1).toString());
            }
          }
        }
        for (const j in index) {
          pickedWaypts.push(dict[index[j]]);
          if (j % 2 == 0) {
            console.log("index[j]", index[j]);
            passengerArr.push(passenger[index[j] / 2].route_id);
          }
        }
        console.log("localStorage.setItem", index);
        console.log("result", pickedWaypts, passengerArr);
        localStorage.setItem("index", index);
        showPickedPassenger(passenger, index);
      } else {
        if (persons == 0) {
          alert("未選擇乘客");
        } else {
          for (const j in index) {
            if (index[j] != num.toString()) {
              if (index[j] != (num + 1).toString()) {
                console.log("- button", index[j], num, (index[j] != num));
                newIndex.push(index[j].toString());
              }
            }
          }
          console.log(newIndex);
          for (const j in newIndex) {
            pickedWaypts.push(dict[newIndex[j]]);
            if (j % 2 == 0) {
              passengerArr.push(passenger[index[j] / 2].route_id);
            }
          }
          console.log("result", pickedWaypts, passengerArr);
          localStorage.setItem("index", newIndex);
          showPickedPassenger(passenger, newIndex);
        }
      }
    });
  }
}

function countCurrentPersons (passenger, index) {
  let counter = 0;
  for (const i in index) {
    console.log("Number(index[i])", Number(index[i]));
    if (Number(index[i]) % 2 == 0) {
      const num = Number(index[i]) / 2;
      console.log("passenger[num].persons", passenger[num].persons, counter);
      counter += passenger[num].persons;
    }
  }
  console.log("countCurrentPersons", counter);
  return counter;
}

function showPickedPassenger (passenger, index) {
  const newIndex = [];
  console.log(index);
  for (let i = 0; i < index.length; i += 2) {
    newIndex.push(index[i]);
  }
  const pickedPassenger = document.getElementById("picked-passenger");
  pickedPassenger.innerHTML = "";
  for (const i in newIndex) {
    const num = newIndex[i] / 2;
    pickedPassenger.innerHTML += `<li>乘客${num + 1}:<br> 起點：${passenger[num].origin} <br>
    終點：${passenger[num].destination} ｜ 人數：${passenger[num].persons}人</li>`;
  }
}

// socket send notification
function matchedBtn (driver, passenger, verifyToken, query) {
  const applyRoute = document.querySelectorAll(".button")[0];
  const passengerRouteId = [];
  applyRoute.addEventListener("click", async () => {
    const index = (localStorage.getItem("index")).split(",");

    const passengerId = [];
    for (const i in index) {
      if (index[i] % 2 == 0) {
        passengerRouteId.push(passenger[index[i] / 2].route_id);
        passengerId.push(passenger[index[i] / 2].user_id);
      }
    }
    const routeInfo = {
      receiverId: passengerId,
      passengerRouteId: passengerRouteId,
      url: `./passenger-search-detail.html?id=${driver.routeId}`,
      content: `車主${driver.name}已接受你的行程，立即前往查看`,
      type: "match",
      icon: "./uploads/images/member.png"
    };
    console.log(123);
    socket.emit("notifiyPassenger", routeInfo);
    alert("通知已傳送");
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
    document.location.href = "./";
  });
}

function skipBtn (query) {
  const skipRoute = document.querySelectorAll(".button")[1];
  skipRoute.addEventListener("click", () => {
    document.location.href = "./";
  });
}
