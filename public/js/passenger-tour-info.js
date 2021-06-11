
async function wrapper () {
  const verifyToken = localStorage.getItem("access_token");
  const query = window.location.search;
  const res = await fetch(`/api/1.0/tour-info${query}`, {
    method: "GET",
    headers: new Headers({
      Authorization: "Bearer " + verifyToken
    })
  });
  const data = await res.json();
  console.log(data);
  const { driverInfo, passengerInfo } = data;
  document.querySelectorAll("h2")[0].innerHTML = "你的行程";
  document.getElementById("my-route").innerHTML =
  `<h3 id="my-title">你的路線</h3>
  <div id="my-wrapper">
      <div id="my-detail">
          <div id="my-date">日期：${passengerInfo[0].date}</div>
          <div id="my-seats">${passengerInfo[0].persons}個座位</div>
      </div>
      <div class="my-upper">
          <img id="my-route-img" src="./uploads/images/route.png">
          <div id="my-location">
              <div id="my-origin">起點：${passengerInfo[0].origin}</div>
              <div id="my-destination">終點：${passengerInfo[0].destination}</div>
          </div>
      </div>
  </div>`;
  const companionRoute = document.getElementById("companion-route");
  if (passengerInfo[0].match_status == 0) {
    companionRoute.innerHTML =
    html(passengerInfo, "");
    confirm(driverInfo, passengerInfo, verifyToken, query);
    contact(passengerInfo[0].id, driverInfo.id);
  } else if (driverInfo.match_status == 1) {
    companionRoute.innerHTML =
    html(driverInfo, "greenspot", verifyToken, query);
    contact(passengerInfo[0].id, driverInfo.id);
  } else {
    companionRoute.innerHTML =
    html(driverInfo, "refuse", verifyToken, query);
  }
  initMap(driverInfo, passengerInfo);
}

function confirm (driverInfo, passengerInfo, verifyToken, query) {
  const confirm = document.getElementById("confirm");
  confirm.addEventListener("click", async () => {
    const res = await fetch(`/api/1.0/tour-confirm${query}`, {
      method: "POST",
      body: JSON.stringify({ passengerRouteId: passengerInfo[0].route_id, matchStatus: 1 }),
      headers: new Headers({
        Authorization: "Bearer " + verifyToken,
        "Content-type": "application/json"
      })
    });
    const data = await res.json();
    console.log(data);
    const routeInfo = {
      receiverId: [driverInfo.id],
      passengerRouteId: [driverInfo.route_id],
      url: `./driver-tour-info.html${query}`,
      content: `乘客${passengerInfo[0].name}已接受你的行程，立即前往查看`,
      type: "match",
      icon: "./uploads/images/member.png"
    };
    if (!data.error) {
      socket.emit("notifiyPassenger", routeInfo);
    }
  });
  const refuse = document.getElementById("refuse");
  refuse.addEventListener("click", async () => {
    const res = await fetch(`/api/1.0/tour-confirm${query}`, {
      method: "POST",
      body: JSON.stringify({ passengerRouteId: passengerInfo[0].route_id, matchStatus: -1 }),
      headers: new Headers({
        Authorization: "Bearer " + verifyToken,
        "Content-type": "application/json"
      })
    });
    const data = await res.json();
    console.log(data);
    const routeInfo = {
      receiverId: [driverInfo.id],
      passengerRouteId: [driverInfo.route_id],
      url: `./driver-tour-info.html${query}`,
      content: `乘客${passengerInfo[0].name}已謝絕你的行程`,
      type: "match",
      icon: "./uploads/images/member.png"
    };
    socket.emit("notifiyPassenger", routeInfo);
  });
}

function contact (passengerId, driverId) {
  const contact = document.getElementById("contact");
  contact.addEventListener("click", () => {
    const room = makeRooom(passengerId, driverId);
    document.location.href = `./chat.html?room=${room}`;
  });
}

function initMap (driverInfo, passengerInfo) {
  const originCoordinate = driverInfo.origin;
  const destinationCoordinate = driverInfo.destination;
  const waypoints = [{ location: { lat: passengerInfo[0].origin_coordinate.x, lng: passengerInfo[0].origin_coordinate.y }, stopover: true },
    { location: { lat: passengerInfo[0].destination_coordinate.x, lng: passengerInfo[0].destination_coordinate.y }, stopover: true }];
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
    waypoints,
    optimizeWaypoints: true,
    travelMode: "DRIVING"
  };

  directionsService.route(request, function (response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsRenderer.setDirections(response);

      console.log(response, response.routes[0].legs[1].start_location);

      const wayptsOrigin = new google.maps.LatLng(waypoints[0].location);
      let marker = new google.maps.Marker({
        map: map,
        title: "title",
        label: "起點"
      });
      marker.setPosition(wayptsOrigin);

      const origin = { lat: driverInfo.origin_coordinate.x, lng: driverInfo.origin_coordinate.y };
      marker = new google.maps.Marker({
        map: map,
        title: "title",
        position: new google.maps.LatLng(origin)
      });

      const destination = { lat: driverInfo.destination_coordinate.x, lng: driverInfo.destination_coordinate.y };
      marker = new google.maps.Marker({
        map: map,
        title: "title",
        position: new google.maps.LatLng(destination)
      });

      const wayptsDestination = new google.maps.LatLng(waypoints[1].location);
      marker = new google.maps.Marker({
        map: map,
        title: "title",
        label: "終點"
      });
      marker.setPosition(wayptsDestination);
    }
  });
}

function html (driverInfo, confirmStatus) {
  let confirmSign = "";
  let button = "";
  if (confirmStatus == 0) {
    confirmSign = "";
    button = `<div class="button-container">
    <button class="confirm">確認</button>
    <button class="refuse">謝絕</button></div>`;
  } else {
    confirmSign = `<div class="companion-confirm">
  <img class="companion-confirm-status" src="./uploads/images/${confirmStatus}.png"></div>`;
    button = "";
  }
  const html =
  `<h4 id="companion-title">車主</h4>
  <div class="companion-wrapper">
  <div class="companion-upper">
      <img class="companion-img" src="./uploads/images/route.png">
      <div class="companion-location">
          <div class="companion-origin">${driverInfo.origin}</div>
          <div class="companion-destination">${driverInfo.destination}</div>
      </div>
      ${confirmSign}     
  </div>
  <div class="under">
      <img class="profile" src="./uploads/images/member.png">
      <div class="name">${driverInfo.name}</div>
      <div class="persons">${driverInfo.seats_left}人</div>
      <div class="time">${driverInfo.time}</div>
      <div class="btn-wrap"><button class="contact">聯繫乘客</button></div>
  </div>
  ${button}                                     
</div>`;
  return html;
}

const makeRooom = (userId, receiverId) => {
  if (userId > receiverId) {
    return `${receiverId}WITH${userId}`;
  } else {
    return `${userId}WITH${receiverId}`;
  }
};
