
const query = window.location.search;

console.log(query);
async function wrapper () {
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
  document.getElementById("a-location").innerHTML =
      `<h4>起點：${passengerInfo[0].origin}</h4>
      <h4>終點：${passengerInfo[0].destination}</h4>`;
  document.getElementById("a-detail").innerHTML =
      `<h5>日期：${passengerInfo[0].date}</h5>
      <h5>人數：${passengerInfo[0].persons}</h5>`;

  document.getElementById("b-location").innerHTML =
      `<br><h3>車主行程</h3>
      <h4>起點：${driverInfo.origin}</h4>
        <h4>終點：${driverInfo.destination}</h4>`;
  document.getElementById("b-detail").innerHTML =
      `<h5>日期：${driverInfo.date}</h5>
      <h5>時間：${driverInfo.time}</h5>
      <h5>人數：${driverInfo.seats_left}</h5>
      <h5>單人費用：${driverInfo.fee}</h5>`;

  // <div>${data[0].picture}</div>
  if (passengerInfo[0].match_status == 0) {
    document.getElementById("b-role").innerHTML =
        `<div><img src="../uploads/images/member.png"></div>
      <div>${driverInfo.name}</div>
      <button id="contact" type="button">聯繫車主</button>
      <button class="homePage" id="confirm">確認</button>
      <button class="homePage" id="refuse">謝絕</button>`;
    confirm(driverInfo, passengerInfo);
    contact(passengerInfo[0].id, driverInfo.id);
  } else if (passengerInfo[0].match_status == 1) {
    document.getElementById("b-role").innerHTML =
        `<div><img src="../uploads/images/member.png"></div>
      <div>${driverInfo.name}</div>
      <button id="contact" type="button">聯繫車主</button>
      <h3>車主已確認</h3>`;
    contact(passengerInfo[0].id, driverInfo.id);
  } else {
    document.getElementById("b-role").innerHTML =
    `<div><img src="../uploads/images/member.png"></div>
    <div>${driverInfo.name}</div>
    <button id="contact" type="button">聯繫車主</button>
    <h3>車主已謝絕</h3>`;
  }
  initMap(driverInfo, passengerInfo);
}

function confirm (driverInfo, passengerInfo) {
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
