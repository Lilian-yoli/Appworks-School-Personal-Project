
const query = window.location.search;
const socket = io();
const verifyToken = localStorage.getItem("access_token");
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
      `<h4>起點：${driverInfo.origin}</h4>
        <h4>終點：${driverInfo.destination}</h4>`;
  document.getElementById("a-detail").innerHTML =
      `<h5>日期：${driverInfo.date}</h5>
      <h5>時間：${driverInfo.time}</h5>
      <h5>人數：${driverInfo.seats_left}</h5>
      <h5>單人費用：${driverInfo.fee}</h5>`;
  for (const i in passengerInfo) {
    document.getElementById("b-location").innerHTML =
      `<br><h2>乘客資訊</h2>
      <h4>起點：${passengerInfo[i].origin}</h4>
      <h4>終點：${passengerInfo[i].destination}</h4>`;
    document.getElementById("b-detail").innerHTML =
      `<h5>日期：${passengerInfo[i].date}</h5>
      <h5>人數：${passengerInfo[i].persons}</h5>`;
    if (driverInfo.match_status == 0) {
      document.getElementById("b-role").innerHTML =
      `<div><img src="../uploads/images/member.png"></div>
      <div>${passengerInfo[i].name}</div>
      <button class="contact btn" id="${i}.1">聯繫乘客</button>
      <button class="confirm btn" id="${i}.2">確認</button>
      <button class="refuse btn" id="${i}.3">謝絕</button>`;
      confirm(driverInfo, passengerInfo);
      contact(passengerInfo[i].id, driverInfo.id);
    } else if (driverInfo.match_status == 1) {
      document.getElementById("b-role").innerHTML =
        // <div>${data[0].picture}</div>
        `<div><img src="../uploads/images/member.png"></div>
        <div>${passengerInfo[i].name}</div>
        <button class="contact btn" id="${i}.1">聯繫乘客</button>
        <h3>乘客已確認</h3>`;
      contact(passengerInfo[i].id, driverInfo.id);
    } else {
      document.getElementById("b-role").innerHTML =
    `<div><img src="../uploads/images/member.png"></div>
    <div>${driverInfo.name}</div>
    <button class="contact btn" id="${i}.1">聯繫乘客</button>
    <h3>車主已謝絕</h3>`;
    }
  }
  initMap(driverInfo, passengerInfo);
};

function confirm (driverInfo, passengerInfo) {
  const confirm = document.querySelector(".confirm");
  confirm.addEventListener("click", async (e) => {
    let index = e.target.id;
    index = index.split(".")[0];
    console.log(index);
    const res = await fetch(`/api/1.0/tour-confirm${query}`, {
      method: "POST",
      body: JSON.stringify({ passengerRouteId: passengerInfo[index].route_id, matchStatus: 1 }),
      headers: new Headers({
        Authorization: "Bearer " + verifyToken,
        "Content-type": "application/json"
      })
    });
    const data = await res.json();
    console.log(data);
    const routeInfo = {
      receiverId: [passengerInfo[index].id],
      passengerRouteId: [passengerInfo[index].route_id],
      url: `./passenger-tour-info.html${query}`,
      content: `車主${driverInfo.name}已接受你的行程，立即前往查看`,
      type: "match",
      icon: "./uploads/images/member.png"
    };
    if (!data.error) {
      socket.emit("notifiyPassenger", routeInfo);
    }
  });
  const refuse = document.querySelector(".refuse");
  refuse.addEventListener("click", async (e) => {
    let index = e.target.id;
    index = index.split(".")[0];
    console.log(index);
    const res = await fetch(`/api/1.0/tour-confirm${query}`, {
      method: "POST",
      body: JSON.stringify({ passengerRouteId: passengerInfo[index].route_id, matchStatus: -1 }),
      headers: new Headers({
        Authorization: "Bearer " + verifyToken,
        "Content-type": "application/json"
      })
    });
    const data = await res.json();
    console.log(data);
    const routeInfo = {
      receiverId: [passengerInfo[index].id],
      passengerRouteId: [driverInfo.route_id],
      url: `./passenger-tour-info.html${query}`,
      content: `車主${passengerInfo.name}已謝絕你的行程`,
      type: "match",
      icon: "./uploads/images/member.png"
    };
    socket.emit("notifiyPassenger", routeInfo);
  });
}

function contact (passengerInfo, driverInfo) {
  for (const i in passengerInfo) {
    const contact = document.querySelectorAll(".contact")[i];
    console.log(contact);
    contact.addEventListener("click", (e) => {
      let index = e.target.id;
      index = index.split(".")[0];
      console.log(index);
      const room = makeRooom(passengerInfo[index].id, driverInfo.id);
      document.location.href = `./chat.html?room=${room}`;
    });
  }
}

function initMap (driverInfo, passengerInfo) {
  const originCoordinate = driverInfo.origin;
  const destinationCoordinate = driverInfo.destination;
  const waypoints = [];
  for (const i in passengerInfo) {
    waypoints.push({ location: { lat: passengerInfo[i].origin_coordinate.x, lng: passengerInfo[i].origin_coordinate.y }, stopover: true },
      { location: { lat: passengerInfo[i].destination_coordinate.x, lng: passengerInfo[i].destination_coordinate.y }, stopover: true });
  }
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
  console.log(waypoints);
  for (let i = 0; i < passengerInfo.length; i += 2) {
    marker(i, map, waypoints, google);
  }

  directionsService.route(request, function (response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsRenderer.setDirections(response);
      console.log(waypoints);

      const origin = { lat: driverInfo.origin_coordinate.x, lng: driverInfo.origin_coordinate.y };
      let marker = new google.maps.Marker({
        map: map,
        title: "title",
        label: "起點",
        position: new google.maps.LatLng(origin)
      });

      const destination = { lat: driverInfo.destination_coordinate.x, lng: driverInfo.destination_coordinate.y };
      marker = new google.maps.Marker({
        map: map,
        title: "title",
        label: "終點",
        position: new google.maps.LatLng(destination)
      });
    }
  });
}

function marker (i, map, waypoints, google) {
  const wayptsOrigin = new google.maps.LatLng(waypoints[i].location);
  console.log(wayptsOrigin, i);
  let marker = new google.maps.Marker({
    map: map,
    title: "title",
    label: `${i + 1}`
  });
  marker.setPosition(wayptsOrigin);

  const wayptsDestination = new google.maps.LatLng(waypoints[i + 1].location);
  console.log(wayptsOrigin);
  marker = new google.maps.Marker({
    map: map,
    title: "title",
    label: `${i + 1}`
  });
  marker.setPosition(wayptsDestination);
}
