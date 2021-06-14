
async function wrapper () {
  const socket = io();
  const verifyToken = localStorage.getItem("access_token");
  const query = window.location.search;
  localStorage.setItem("index", 0);
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
    console.log(123);
    const pathSuggestion = document.getElementById("path-suggestion");
    pathSuggestion.append(Object.assign(document.createElement("h2"),
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
      { value: "回首頁" },
      { id: "homepage" }));
    const map = document.getElementById("map");
    initMap([], data.origin, data.destination, true, data);
  } else {
    const myRoute = document.getElementById("my-route");
    myRoute.innerHTML +=
  `<h2 id="my-title">你的路線</h2>
  <div id="my-wrapper">
      <div id="my-origin">起點：${passenger.origin}</div>
      <div id="my-destination">終點：${passenger.destination}</div>
      <div class="my-detail">
          <div id="my-date">日期：${passenger.date}</div>
          <div id="my-seats">${passenger.persons}位</div>
      </div>
  </div>`;
    const pathSuggestion = document.getElementById("path-suggestion");
    for (const i in driver) {
      pathSuggestion.innerHTML +=
    `<div class="suggestion-wrapper">
        <div class="suggestion-upper">
            <img class="suggestion-img-img" src="./uploads/images/route.png">
            <div class="suggestion-location">
                <div class="suggestion-origin">${driver[i][1].detail.origin}</div>
                <div class="suggestion-destination">${driver[i][1].detail.destination}</div>
            </div>
            <div class="suggestion-option">
                <img class="suggestion-add" id=${i} src="./uploads/images/graycheck.png">
            </div>     
        </div>
        <div class="under">
            <img class="profile" src="${driver[i][1].detail.picture}">
            <div class="name">${driver[i][1].detail.name}</div>
            <div class="persons">${driver[i][1].detail.seats_left}人</div>
            <div class="time">${driver[i][1].detail.time}</div>
            <div class="btn-wrap"><button class="contact" id="${i}">聯繫車主</button></div>
        </div>                        
    </div>`;
    }
    const add = document.getElementsByClassName("suggestion-add")[0];
    add.src = "./uploads/images/check.png";
    const title = document.createElement("h2");
    title.className = "suggestion-title";
    title.textContent = "推薦車主";
    pathSuggestion.insertBefore(title, pathSuggestion.firstChild);
    console.log(myRoute);

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

    initMap(waypts, driverOrigin, driverDestination, true, driver);
    chooseWypts(driver, waypts);
    clickEvent(driver, passenger);
    // matchedBtn(driver, passenger, verifyToken, query);
    skipBtn();
  }
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
  if(waypts.length< 1){
    directionsService.route(request, function (response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(response);
  
        const wayptsOrigin = new google.maps.LatLng({lat: driver.originCoordinate.x, lng: driver.originCoordinate.y});
        let marker = new google.maps.Marker({
          map: map,
          title: "title",
          label: "起點"
        });
        marker.setPosition(wayptsOrigin);
        
        const wayptsDestination = new google.maps.LatLng({lat: driver.destinationCoordinate.x, lng: driver.destinationCoordinate.y});
        marker = new google.maps.Marker({
          map: map,
          title: "title",
          label: "終點"
        });
        marker.setPosition(wayptsDestination);
      }
    });
  } else {

  directionsService.route(request, function (response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsRenderer.setDirections(response);

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
}
}

function drawDirection(){

}

function chooseWypts (driver, waypts) {
  for (const i in driver) {
    const add = document.getElementsByClassName("suggestion-add")[i];
    add.addEventListener("click", (e) => {
      const index = localStorage.getItem("index");
      const num = e.target.id;
      console.log("num", num);
      e.preventDefault();
      if (num != index) {
        const lastAdd = document.getElementsByClassName("suggestion-add")[index];
        lastAdd.src = "https://www.co-car.site/uploads/images/graycheck.png";
        add.src = "https://www.co-car.site/uploads/images/check.png";
        const driverOrigin = driver[num][1].detail.origin;
        const driverDestination = driver[num][1].detail.destination;
        localStorage.setItem("index", num);
        initMap(waypts, driverOrigin, driverDestination, true, driver);
      }
    });
  }
}

const clickEvent = async (driver, passenger) => {
  const socket = io();
  const verifyToken = localStorage.getItem("access_token");
  let data = "";

  for (const i in driver) {
    const contact = document.getElementsByClassName("contact")[i];
    contact.addEventListener("click", async () => {
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
      const room = makeRooom(data.userId, data.receiverId);
      document.location.href = `./chat.html?room=${room}`;
    });
  }

  const book = document.getElementById("apply-route");
  book.addEventListener("click", async () => {
    const index = localStorage.getItem("index");
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
      return swal({
        text: "當日路線已建立，請至「你的行程」查看",
        icon: "warning"
      });
    }
    console.log(idInfo);
    console.log(idInfo.tourId);
    const routeInfo = {
      receiverId: [driver[index][1].detail.user_id],
      passengerRouteId: null,
      url: `./driver-tour-info.html?routeid=${driver[index][1].detail.offered_routes_id}&tour=${idInfo.tourId}`,
      content: `乘客${idInfo.username}已接受你的行程，立即前往查看`,
      type: "match",
      icon: "./uploads/images/match.svg",
      confirm: 0
    };
    socket.emit("notifiyPassenger", routeInfo);
    console.log(routeInfo);
    swal({
      text: "通知已傳送",
      icon: "success"
    });
    document.location.href = `./passenger-tour-info.html?routeid=${driver[index][1].detail.offered_routes_id}
    &tour=${idInfo.tourId}&passenger=${passenger.route_id}`;
  });
};

function skipBtn () {
  const skipRoute = document.querySelectorAll(".button")[1];
  skipRoute.addEventListener("click", () => {
    swal({
      text: "路線已儲存",
      icon: "success"
    });
    document.location.href = "./";
  });
}

const makeRooom = (userId, receiverId) => {
  if (userId > receiverId) {
    return `${receiverId}WITH${userId}`;
  } else {
    return `${userId}WITH${receiverId}`;
  }
};

function loadScript () {
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDSS1j7r93IKssIMKJvkh6U5iRFlW8Jeto&callback=wrapper";
  document.body.appendChild(script);
}

window.onload = function () {
  setTimeout(loadScript(), 1000);
};
