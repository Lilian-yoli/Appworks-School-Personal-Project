
async function wrapper () {
  const socket = io();
  const query = window.location.search;
  const verifyToken = localStorage.getItem("access_token");

  if (!query) {
    window.location.href = "./404.html";
  }
  const response = await fetch(`/api/1.0/route-suggestion${query}`, {
    method: "GET",
    headers: new Headers({
      Authorization: "Bearer " + verifyToken,
      "Content-Type": "application/json"
    })
  });
  const data = await response.json();
  if (data.error) {
    swal({
      text: "data.error",
      icon: "warning"
    });
    window.location.href = "./";
  }
  const driver = data.driverInfo;
  const passenger = data.passengerInfo;
  const index = [];
  const pickedWaypts = [];
  const passengerArr = [];
  const dict = {};

  socket.emit("login", driver.id);

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

  if (passenger.length < 1) {
    const pathSuggestion = document.getElementById("path-suggestion");
    pathSuggestion.append(Object.assign(document.createElement("h2"),
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
      { value: "回首頁" },
      { id: "homepage" }));
    document.querySelector(".button-container").innerHTML = "";
    initMap(driver, []);
  } else {
    let personCounter = 0;
    for (let i = 0; i < passenger.length; i++) {
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
              <div class="btn-wrap"><button class="contact" id="${i}">聯繫乘客</button></div>
          </div>                        
      </div>`;
      personCounter += passenger[i].persons;
      // if seats enough, add waypts
      if (personCounter <= driver.seats_left) {
        const originObj = { lat: passenger[i].origin_coordinate.x, lng: passenger[i].origin_coordinate.y };
        const destinationObj = { lat: passenger[i].destination_coordinate.x, lng: passenger[i].destination_coordinate.y };
        pickedWaypts.push(originObj);
        pickedWaypts.push(destinationObj);
        index[i] = i;
        passengerArr.push(passenger[i].id);
        showPickedPassenger(i);
      }
    };
    const pathSuggestion = document.getElementById("path-suggestion");
    const title = document.createElement("h2");
    title.className = "suggestion-title";
    title.textContent = "推薦乘客";
    pathSuggestion.insertBefore(title, pathSuggestion.firstChild);
    localStorage.setItem("index", index);
    initMap(driver, pickedWaypts);
    chooseWypts(passenger, driver, pickedWaypts, dict, passengerArr);
    contact(passenger, driver);
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

function chooseWypts (passenger, driver, pickedWaypts, dict, passengerArr) {
  for (let i = 0; i < passenger.length; i++) {
    const add = document.querySelectorAll(".suggestion-add")[i];
    add.addEventListener("click", (e) => {
      e.preventDefault();
      let index = localStorage.getItem("index");
      if (index.length < 1) {
        index = [];
      } else {
        index = index.split(",");
      }
      const num = e.target.id;
      const newIndex = [];

      const persons = countCurrentPersons(passenger, index);

      if (add.src != "https://www.co-car.site/uploads/images/check.png") {
        if (index.indexOf(num.toString()) == -1) {
          if (persons + passenger[num].persons > driver.seats_left) {
            swal({
              text: "選擇人數超過可提供座位",
              icon: "warning"
            });
          } else {
            index.push(num.toString());
            passengerArr = [];
            pickedWaypts = [];
            for (const j in index) {
              pickedWaypts.push(dict[index[j] * 2]);
              pickedWaypts.push(dict[index[j] * 2 + 1]);
              passengerArr.push(passenger[index[j]].id);
            }
            showPickedPassenger(num);
          }
        }

        localStorage.setItem("index", index);
        initMap(driver, pickedWaypts);
      } else {
        for (const i in index) {
          if (index[i] != num) {
            newIndex.push(index[i]);
          }
          passengerArr = [];
          pickedWaypts = [];
          for (const i in newIndex) {
            pickedWaypts.push(dict[index[i] * 2]);
            pickedWaypts.push(dict[index[i] * 2 + 1]);
            passengerArr.push(passenger[index[i]].id);
          }
        }

        localStorage.setItem("index", newIndex);
        initMap(driver, pickedWaypts);
        showPickedPassenger(num);
      }
    });
  }
}

function countCurrentPersons (passenger, index) {
  let counter = 0;
  for (const i in index) {
    counter += passenger[index[i]].persons;
  }
  return counter;
}

function showPickedPassenger (num) {
  const pickedPassenger = document.getElementsByClassName("suggestion-wrapper")[num];
  const add = document.getElementsByClassName("suggestion-add")[num];
  if (add.src == "https://www.co-car.site/uploads/images/check.png") {
    add.src = "./uploads/images/graycheck.png";
  } else {
    add.src = "./uploads/images/check.png";
  }
}

// socket send notification
function matchedBtn (driver, passenger, verifyToken, query) {
  const applyRoute = document.getElementById("apply-route");
  const passengerRouteId = [];
  applyRoute.addEventListener("click", async () => {
    let index = localStorage.getItem("index");
    if (index.length < 0) {
      return swal({
        text: "未選擇乘客",
        icon: "warning"
      });
    } else {
      index = index.split(",");
      const passengerId = [];
      for (const i in index) {
        passengerRouteId.push(passenger[index[i]].id);
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
      if (!data.tourId.error) {
        const routeInfo = {
          receiverId: passengerId,
          passengerRouteId: passengerRouteId,
          url: `./passenger-tour-info.html?routeid=${driver.routeId}&tour=${data.tourId}`,
          content: `車主${driver.name}已接受你的行程，立即前往查看`,
          type: "match",
          icon: "./uploads/images/match.svg"
        };

        socket.emit("notifyPassenger", routeInfo);
        swal({
          text: "已傳送通知",
          icon: "success"
        });
        document.location.href = `./driver-tour-info.html?routeid=${driver.routeId}&tour=${data.tourId}`;
      } else {
        swal({
          text: "路線曾建立過，請至「車主行程」查看",
          icon: "warning"
        });
      }
    }
  });
}

function skipBtn (query) {
  const skipRoute = document.getElementById("skip");
  skipRoute.addEventListener("click", () => {
    swal({
      text: "路線已儲存",
      icon: "success"
    });
    document.location.href = "./";
  });
}

function contact (passenger, driver) {
  for (const i in passenger) {
    const contact = document.getElementsByClassName("contact")[i];
    contact.addEventListener("click", async (e) => {
      const num = e.target.id;
      const room = makeRooom(driver.id, passenger[num].user_id);
      document.location.href = `./chat.html?room=${room}`;
    });
  }
}

const makeRooom = (userId, receiverId) => {
  if (userId > receiverId) {
    return `${receiverId}WITH${userId}`;
  } else {
    return `${userId}WITH${receiverId}`;
  }
};

// function loadScript () {
//   const script = document.createElement("script");
//   script.type = "text/javascript";
//   script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDSS1j7r93IKssIMKJvkh6U5iRFlW8Jeto&callback=wrapper";
//   document.body.appendChild(script);
// }

// window.onload = function () {
//   setTimeout(loadScript(), 1000);
// };
