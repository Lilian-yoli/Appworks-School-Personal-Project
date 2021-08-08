
const query = window.location.search;
const verifyToken = localStorage.getItem("access_token");
if (!query) {
  window.location.href = "./404.html";
}

if (!verifyToken) {
  window.location.href = "./login.html";
}

async function wrapper () {
  const response = await fetch(`/api/1.0/driver-itinerary-detail${query}`, {
    method: "GET",
    headers: new Headers({
      Authorization: "Bearer " + verifyToken
    })
  });
  const data = await response.json();
  if (data.error) {
    Swal.fire({
      text: data.error,
      icon: "warning",
      time: 2000,
      button: false
    });
    window.location.href = "./";
  } else {
    createDriverInfo(data);
    initMap(data);
    contact(data);
    applyRoute(data, verifyToken);
    skip();
  }
}

function createDriverInfo (data) {
  document.getElementById("the-route").innerHTML =
  `<div class="route-wrapper">
  <div class="detail-date">日期：${data.driverInfo[0].date}</div>
  <div class="route-upper">
      <img class="route-img" src="./uploads/images/route.png">
      <div class="route-location">
          <div class="route-origin">${data.driverInfo[0].origin}</div>
          <div class="route-destination">${data.driverInfo[0].destination}</div>
      </div>
  </div>
  <div class="under">
      <img class="profile" src="${data.driverInfo[0].picture}">
      <div class="name">${data.driverInfo[0].name}</div>
      <div class="persons">${data.driverInfo[0].seats_left}人</div>
      <div class="time">${data.driverInfo[0].time}</div>
      <div class="btn-wrap"><button class="contact" id="contact">聯繫車主</button></div>
  </div>                        
</div>`;
  if (data.driverInfo[0].userId == data.userInfo[0].id) {
    document.getElementById("contact").style.display = "none";
  }
}

function contact (data) {
  const contact = document.getElementById("contact");
  contact.addEventListener("click", () => {
    if (!data.userInfo) {
      document.location.href = "./login.html";
    }
    const room = makeRooom(data.driverInfo[0].userId, data.userInfo[0].id);
    document.location.href = `./chat.html?room=${room}`;
  });
};

const applyRoute = (data) => {
  const applyRoute = document.getElementById("apply-route");
  applyRoute.addEventListener("click", async () => {
    Swal.fire({
      title: "輸入搭乘人數",
      input: "select",
      inputOptions: {
        1: "1",
        2: "2",
        3: "3",
        4: "4",
        5: "5"
      },
      button: true,
      allowOutsideClick: () => !Swal.isLoading(),
      function (value) {
        return new Promise(function (resolve, reject) {
          if (value <= data.driverInfo[0].seats_left) {
            resolve();
          } else {
            resolve("人數超過座位上線");
          }
        });
      }
    }).then(async function (result) {
      if (result.isConfirmed) {
        Swal.fire({
          icon: "success",
          html: "人數為：" + result.value

        });
        if (result.value > data.driverInfo[0].seats_left) {
          Swal.fire({
            text: "選擇人數超過車位上線",
            icon: "warning"
          });
          return;
        }
        const passengerInfo = await insertPassengerInfo(data, result.value);
        if (passengerInfo) {
          await setTourInfo(data, passengerInfo);
        } else {
          Swal.fire({
            text: "路線已建立過，請至「乘客路線」查看",
            icon: "warning"
          });
        }
      }
    });
  });
};

const insertPassengerInfo = async (data, persons) => {
  const responseInsert = await fetch(`/api/1.0/passenger-search${query}`, {
    method: "POST",
    body: JSON.stringify({
      persons: persons,
      date: data.driverInfo[0].date
    }),
    headers: new Headers({
      Authorization: "Bearer " + verifyToken,
      "Content-type": "application/json"
    })
  });
  const insertData = await responseInsert.json();
  if (insertData.error) {
    return null;
  }

  return insertData;
};

const setTourInfo = async (data, passengerInfo) => {
  const responseTour = await fetch("/api/1.0/passenger-tour", {
    method: "POST",
    body: JSON.stringify({
      driverRouteId: data.driverInfo[0].routeId,
      passengerRouteId: passengerInfo.routeId
    }),
    headers: new Headers({
      Authorization: "Bearer " + verifyToken,
      "Content-type": "application/json"
    })
  });
  const tourData = await responseTour.json();

  if (!tourData.error) {
    const routeInfo = {
      receiverId: [data.driverInfo[0].userId],
      passengerRouteId: passengerInfo.routeInfo,
      url: `./driver-tour-info.html?routeid=${data.driverInfo[0].routeId}&tour=${tourData.tourId}`,
      content: `乘客${passengerInfo.passengerName}已接受你的行程，立即前往查看`,
      type: "match",
      icon: "./uploads/images/match.svg"
    };
    socket.emit("notifyPassenger", routeInfo);
    swal.fire({
      text: "已傳送通知",
      icon: "success"
    });
    document.location.href = `./passenger-tour-info.html?routeid=${data.driverInfo[0].routeId}&tour=${tourData.tourId}`;
  } else {
    swal.fire({
      text: "路線曾建立過，請至「乘客行程」查看",
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
  const originCoordinate = data.driverInfo[0].origin;
  const destinationCoordinate = data.driverInfo[0].destination;

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

      const origin = { lat: data.driverInfo[0].origin_latitude, lng: data.driverInfo[0].origin_longitude };
      let marker = new google.maps.Marker({
        map: map,
        title: "title",
        label: "起點",
        position: new google.maps.LatLng(origin)
      });

      const destination = { lat: data.driverInfo[0].destination_latitude, lng: data.driverInfo[0].destination_longitude };
      marker = new google.maps.Marker({
        map: map,
        title: "title",
        label: "終點",
        position: new google.maps.LatLng(destination)
      });
    }
  });
}
