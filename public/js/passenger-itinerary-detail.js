
const query = window.location.search;
const verifyToken = localStorage.getItem("access_token");

if (!verifyToken) {
  window.location.href = "./login.html";
}

if (!query) {
  window.location.href = "./404.html";
}

async function wrapper () {
  const response = await fetch(`/api/1.0/passenger-itinerary-detail${query}`, {
    method: "GET",
    headers: new Headers({
      Authorization: "Bearer " + verifyToken
    })
  });

  const data = await response.json();
  console.log(data);
  if (data.error) {
    swal.fire({
      text: data.error,
      icon: "warning",
      timer: 3000
    });
    window.location.href = "./";
  }
  createDriverInfo(data);
  initMap(data);
  contact(data);
  applyRoute(data, verifyToken);
  skip();
}

function createDriverInfo (data) {
  document.getElementById("the-route").innerHTML =
  `<div class="route-wrapper">
  <div class="detail-date">日期：${data.passengerInfo[0].date}</div>
  <div class="route-upper">
      <img class="route-img" src="./uploads/images/route.png">
      <div class="route-location">
          <div class="route-origin">${data.passengerInfo[0].origin}</div>
          <div class="route-destination">${data.passengerInfo[0].destination}</div>
      </div>
  </div>
  <div class="under">
      <img class="profile" src="${data.passengerInfo[0].picture}">
      <div class="name">${data.passengerInfo[0].name}</div>
      <div class="persons">${data.passengerInfo[0].persons}人</div>
      <div class="btn-wrap"><button class="contact" id="contact">聯繫乘客</button></div>
  </div>                        
</div>`;
  if (data.passengerInfo[0].userId == data.userInfo[0].id) {
    document.getElementById("contact").style.display = "none";
  }
}

function contact (data) {
  const contact = document.getElementById("contact");
  contact.addEventListener("click", () => {
    if (!data.userInfo) {
      document.location.href = "./login.html";
    }
    const room = makeRooom(data.passengerInfo[0].userId, data.userInfo[0].id);
    document.location.href = `./chat.html?room=${room}`;
  });
};

const applyRoute = (data) => {
  const applyRoute = document.getElementById("apply-route");
  applyRoute.addEventListener("click", async () => {
    const driverRoute = selectDriverRoute(data.passengerInfo[0].date, data.passengerInfo[0].persons);
    Swal.fire({
      title: "選擇你的路線",
      input: "select",
      inputOptions: driverRoute,
      button: true,
      allowOutsideClick: () => !Swal.isLoading(),
      function (value) {
        return new Promise(function (resolve, reject) {
          if (value !== "") {
            resolve();
          } else {
            resolve("行程為必填欄位");
          }
        });
      }
    }).then(async function (result) {
      if (result.isConfirmed) {
        console.log(result);
        Swal.fire({
          icon: "info",
          html: "選擇行程：" + result.value
        });

        await setTourInfo(data, result.value);
      }
    });
  });
};

const selectDriverRoute = async (date, persons) => {
  const responseSelect = await fetch("/api/1.0/driver-route-selection", {
    method: "POST",
    body: JSON.stringify({
      date,
      persons
    }),
    headers: new Headers({
      Authorization: "Bearer " + verifyToken,
      "Content-type": "application/json"
    })
  });
  const selectData = await responseSelect.json();
  console.log(selectData);
  if (selectData.error) {
    return { 0: "當日尚未提供路線" };
  }
  const routes = {};
  for (const route of selectData) {
    routes[route.id] = `${route.time} ${route.origin}～${route.destination}`;
  }
  console.log(routes);
  return routes;
};

const setTourInfo = async (data, driverRouteId) => {
  const responseTour = await fetch("/api/1.0/driver-tour", {
    method: "POST",
    body: JSON.stringify({
      driverRouteId,
      passengerRouteId: [data.passengerInfo[0].id]
    }),
    headers: new Headers({
      Authorization: "Bearer " + verifyToken,
      "Content-type": "application/json"
    })
  });
  const tourData = await responseTour.json();
  console.log(tourData);

  if (!tourData.error) {
    const routeInfo = {
      receiverId: data.passengerInfo[0].id,
      passengerRouteId: data.passengerInfo[0].id,
      url: `./passenger-tour-info.html?id=${driverRouteId}&tour=${tourData.tourId}`,
      content: `車主${tourData.driverInfo}已接受你的行程，立即前往查看`,
      type: "match",
      icon: "./uploads/images/match.svg"
    };
    socket.emit("notifiyPassenger", routeInfo);
    swal.fire({
      text: "已傳送通知",
      icon: "success"
    });
    document.location.href = `./driver-tour-info.html?id=${driverRouteId}&tour=${tourData.tourId}`;
  } else {
    swal.fire({
      text: "路線曾建立過，請至「車主行程」查看",
      icon: "warning"
    });
  }
};

const skip = () => {
  const skip = document.getElementById("skip");
  skip.addEventListener("click", () => {
    window.location.href = "/";
  });
};

const makeRooom = (userId, receiverId) => {
  if (userId > receiverId) {
    return `${receiverId}WITH${userId}`;
  } else {
    return `${userId}WITH${receiverId}`;
  }
};

function initMap (data) {
  const originCoordinate = data.passengerInfo[0].origin;
  const destinationCoordinate = data.passengerInfo[0].destination;

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
    optimizeWaypoints: true,
    travelMode: "DRIVING"
  };

  directionsService.route(request, function (response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsRenderer.setDirections(response);

      const origin = { lat: data.passengerInfo[0].origin_coordinate.x, lng: data.passengerInfo[0].origin_coordinate.y };
      let marker = new google.maps.Marker({
        map: map,
        title: "title",
        label: "起點",
        position: new google.maps.LatLng(origin)
      });

      const destination = { lat: data.passengerInfo[0].destination_coordinate.x, lng: data.passengerInfo[0].destination_coordinate.y };
      marker = new google.maps.Marker({
        map: map,
        title: "title",
        label: "終點",
        position: new google.maps.LatLng(destination)
      });
    }
  });
}
