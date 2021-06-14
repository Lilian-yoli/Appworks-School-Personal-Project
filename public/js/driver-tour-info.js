
const query = window.location.search;
const socket = io();
const verifyToken = localStorage.getItem("access_token");
console.log(query);

async function wrapper () {
  const res = await fetch(`/api/1.0/driver-tour-info${query}`, {
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
          <div id="my-date">日期：${driverInfo.date}</div>
          <div id="my-time">時間：${driverInfo.time}</div>
          <div id="my-seats">${driverInfo.seats_left}個座位</div>
      </div>
      <div class="my-upper">
          <img id="my-route-img" src="./uploads/images/route.png">
          <div id="my-location">
              <div id="my-origin">起點：${driverInfo.origin}</div>
              <div id="my-destination">終點：${driverInfo.destination}</div>
          </div>
      </div>
  </div>`;
  const companionRoute = document.getElementById("companion-route");
  for (const i in passengerInfo) {
    if (passengerInfo[0].match_status == 0) {
      if (data.tourInfo.sendBy == data.userId) {
        companionRoute.innerHTML +=
        html(passengerInfo, i, "grayspot");
      } else {
        companionRoute.innerHTML +=
        html(passengerInfo, i, "");
        confirm(driverInfo, passengerInfo);
      }
    } else if (driverInfo.match_status == 1) {
      companionRoute.innerHTML +=
      html(passengerInfo, i, "greenspot");
    } else {
      companionRoute.innerHTML +=
      html(passengerInfo, i, "refuse");
    }
  }
  contact(passengerInfo, driverInfo);
  initMap(driverInfo, passengerInfo);
  hompage();
};

function confirm (driverInfo, passengerInfo) {
  for (const i in passengerInfo) {
    document.addEventListener("click", async (e) => {
      if(e.target.id == `confirm${i}`){
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
      swal({
        text: "已傳送通知",
        icon: "success",
        buttons: false
      });
    }
    });
  }
  for (const i in passengerInfo) {
    const refuse = document.querySelectorAll(".refuse")[i];
    document.addEventListener("click", async (e) => {
      if(e.target.id == `refuse${i}`){
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
      swal({
        text: "已傳送通知",
        icon: "success",
        buttons: false
      });
    }
    });
  }
}

function contact (passengerInfo, driverInfo) {
  for (const i in passengerInfo) {
    document.addEventListener("click", (e) => {
      if (e.target.id == `contact${i}`) {
        console.log(e.target.id);
        const room = makeRooom(passengerInfo[i].id, driverInfo.id);
        document.location.href = `./chat.html?room=${room}`;
      }
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
  for (let i = 0; i < waypoints.length; i += 2) {
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

function html (passengerInfo, i, confirmStatus) {
  let confirmSign = "";
  let button = "";
  if (confirmStatus == 0) {
    confirmSign = "";
    button = `<div class="button-container">
    <button class="confirm" id="confirm${i}">確認</button>
    <button class="refuse" id="refuse${i}">謝絕</button></div>`;
  } else {
    confirmSign = `<div class="companion-confirm">
  <img class="companion-confirm-status" src="./uploads/images/${confirmStatus}.png"></div>`;
    button = "";
  }
  const html =
  `<h4 id="companion-title">乘客${+i + 1}:</h4>
  <div class="companion-wrapper">
  <div class="companion-upper">
      <img class="companion-img" src="./uploads/images/route.png">
      <div class="companion-location">
          <div class="companion-origin">${passengerInfo[i].origin}</div>
          <div class="companion-destination">${passengerInfo[i].destination}</div>
      </div>
      ${confirmSign}     
  </div>
  <div class="under">
      <img class="profile" src="${passengerInfo[i].picture}">
      <div class="name">${passengerInfo[i].name}</div>
      <div class="persons">${passengerInfo[i].persons}人</div>
      <div class="btn-wrap"><button class="contact" id="contact${i}">聯繫乘客</button></div>
  </div>
  ${button}                                     
</div>
<hr>`;
  return html;
}

const makeRooom = (userId, receiverId) => {
  if (userId > receiverId) {
    return `${receiverId}WITH${userId}`;
  } else {
    return `${userId}WITH${receiverId}`;
  }
};

function hompage () {
  const homepage = document.querySelector(".homepage");
  homepage.addEventListener("click", () => {
    document.location.href = "./";
  });
}

function loadScript () {
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDSS1j7r93IKssIMKJvkh6U5iRFlW8Jeto&callback=wrapper";
  document.body.appendChild(script);
}

window.onload = function () {
  setTimeout(loadScript(), 1000);
};
