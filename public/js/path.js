const socket = io();
async function wrapper () {
  console.log(window.location.search);
  const query = window.location.search;
  const verifyToken = localStorage.getItem("access_token");
  const passengerArr = [];
  const response = await fetch(`/api/1.0/path-suggestion${query}`, {
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
  const pickedWaypts = [];
  const totalWaypts = [];
  const dict = {};

  if (data.length < 0) {
    document.location.href = `drivers-itinerary${query}`;
  }
  document.getElementById("driver-route").innerHTML =
    `<h3>起點：${driver.origin}</h3><h3>終點：${driver.destination}</h3>`;
  let personCounter = 0;
  for (let i = 0; i < passenger.length; i++) {
    personCounter += passenger[i].persons;
    if (personCounter <= driver.seats_left) {
      const originObj = { lat: passenger[i].origin_coordinate.x, lng: passenger[i].origin_coordinate.y };
      const destinationObj = { lat: passenger[i].destination_coordinate.x, lng: passenger[i].destination_coordinate.y };
      pickedWaypts.push(originObj);
      pickedWaypts.push(destinationObj);
      passengerArr.push({ id: passenger[i].route_id, persons: passenger[i].persons, userId: passenger[i].user_id });
    }
    const originObj = { lat: passenger[i].origin_coordinate.x, lng: passenger[i].origin_coordinate.y };
    const destinationObj = { lat: passenger[i].destination_coordinate.x, lng: passenger[i].destination_coordinate.y };
    dict[originObj] = i;
    totalWaypts.push(JSON.stringify(originObj));
    totalWaypts.push(JSON.stringify(destinationObj));
    const pathSuggestion = document.getElementById("path-suggestion");
    pathSuggestion.innerHTML += `<li>乘客${i + 1}: ${passenger[i].origin} 到 <br>
        ${passenger[i].destination} ｜ 人數：${passenger[i].persons}人</li>
        <button class="btn" id="${i}.0" >+</button> <button class="btn" id="${i}.1">-</button>`;
    console.log(pathSuggestion);
  };
  showPickedPassenger(passenger, pickedWaypts, dict);
  console.log(dict);

  initMap(driver, pickedWaypts);
  const passengerInfo = chooseWypts(passenger, driver, pickedWaypts, dict, passengerArr, totalWaypts);
  // clickButton(query, passengerInfo, verifyToken);
  clickButton(driver, passengerInfo);
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

function clickButton (driver, passengerInfo) {
  driver.passengerInfo = passengerInfo;
  console.log(driver);
  socket.emit("matchedPassenger", driver);
}
// function clickButton (query, passengerInfo, verifyToken, driver) {
//   const applyRoute = document.querySelectorAll(".button")[0];
//   const skipRoute = document.querySelectorAll(".button")[1];
//   const offeredRouteId = query.split("=");
//   const matchedPassengers = { passengerRouteId: passengerInfo, passengerType: "request", offeredRouteId: offeredRouteId[1] };
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

function chooseWypts (passenger, driver, pickedWaypts, dict, passengerArr, totalWaypts) {
  console.log(passenger, driver, pickedWaypts, dict);
  for (let i = 0; i < passenger.length * 2; i++) {
    const btn = document.querySelectorAll(".btn")[i];
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const waypts = [];
      const passengerArr2 = [];
      const numInfo = (e.target.id).split(".");
      const num = numInfo[0];
      const persons = countCurrentPersons(passenger, pickedWaypts, dict);
      const origin = { lat: passenger[num].origin_coordinate.x, lng: passenger[num].origin_coordinate.y };
      const destination = { lat: passenger[num].destination_coordinate.x, lng: passenger[num].destination_coordinate.y };
      const passengerPersons = { routeId: passenger[num].route_id, persons: passenger[num].persons, userId: passenger[num].user_id };
      console.log(num);
      if (numInfo[1] != 1) {
        if (persons + passenger[num].persons > driver.seats_left) {
          alert("人數超過可提供空位");
        } else {
          pickedWaypts.push(origin);
          pickedWaypts.push(destination);
          initMap(driver, pickedWaypts);
          showPickedPassenger(passenger, pickedWaypts, dict);
          passengerArr.push(passengerPersons);
          console.log(passengerArr);
          return passengerArr;
        }
      } else {
        if (persons == 0) {
          alert("未選擇乘客");
        } else {
          console.log(pickedWaypts, origin);
          console.log("********", totalWaypts);
          // totalWaypts.indexOf(origin)
          for (const i in pickedWaypts) {
            console.log(totalWaypts.indexOf(JSON.stringify(pickedWaypts[i])), pickedWaypts[i]);
            console.log((totalWaypts.indexOf(JSON.stringify(pickedWaypts[i])) != num * 2));
            if (totalWaypts.indexOf(JSON.stringify(pickedWaypts[i])) != num * 2) {
              if (totalWaypts.indexOf(JSON.stringify(pickedWaypts[i])) != num * 2 + 1) {
                waypts.push(pickedWaypts[i]);
              }
            }
          }
          console.log(waypts);
          pickedWaypts = waypts;
          console.log(waypts);
          initMap(driver, pickedWaypts);
          showPickedPassenger(passenger, pickedWaypts, dict);
          console.log(passengerArr2);
          return passengerArr2;
        }
      }
    });
  }
}

function countCurrentPersons (passenger, pickedWaypts, dict) {
  const index = [];
  let counter = 0;
  for (let i = 0; i < pickedWaypts.length; i += 2) {
    index.push(dict[pickedWaypts[i]]);
  }
  for (const i in index) {
    counter += passenger[i].persons;
  }
  return counter;
}

function showPickedPassenger (passenger, waypts, dict) {
  const index = [];
  for (let i = 0; i < waypts.length; i += 2) {
    index.push(dict[waypts[i]]);
  }
  const pickedPassenger = document.getElementById("picked-passenger");
  pickedPassenger.innerHTML = "";
  for (const i in index) {
    pickedPassenger.innerHTML += `<li>乘客${+i + 1}:<br> 起點：${passenger[i].origin} <br>
    終點：${passenger[i].destination} ｜ 人數：${passenger[i].persons}人</li>`;
  }
}
