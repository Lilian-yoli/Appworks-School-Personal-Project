
// const waypArr = [];
// function promiseXhr (xhr) {
//   return new Promise((resolve, reject) => {
//     if (xhr.readyState === 4 && xhr.status === 200) {
//       const data = xhr.responseText;
//       resolve(data);
//     }
//   });
// }

function wrapper () {
  const waypts = [];
  const waypArr = [];

  let originCoordinate, destinationCoordinate;

  console.log(window.location.search);
  const query = window.location.search;
  const verifyToken = localStorage.getItem("access_token");
  const passengerArr = [];
  fetch(`/api/1.0/path-suggestion${query}`, {
    method: "GET",
    headers: new Headers({
      Authorization: "Bearer " + verifyToken,
      "Content-Type": "application/json"
    })
  }).then((response) => {
    return response.json();
  }).then((data) => {
    console.log("data", data);
    if (data.length < 0) {
      document.location.href = `drivers-itinerary${query}`;
    }
    document.getElementById("driver-route").innerHTML =
    `<h3>起點：${data[data.length - 1].origin}</h3><h3>終點：${data[data.length - 1].destination}</h3>`;

    for (let i = 0; i < data.length - 1; i++) {
      const originObj = { lat: data[i][1].origin_coordinate.x, lng: data[i][1].origin_coordinate.y };
      const destinationObj = { lat: data[i][1].destination_coordinate.x, lng: data[i][1].destination_coordinate.y };
      waypArr.push(originObj);
      waypArr.push(destinationObj);
      console.log(data[i][1]);
      passengerArr.push({ id: data[i][1].route_id, persons: data[i][1].persons});
      const pathSuggestion = document.getElementById("path-suggestion");
      pathSuggestion.innerHTML += `<li>乘客${i + 1}: ${data[i][1].origin} 到 ${data[i][1].destination} ｜ 人數：${data[i][1].persons}人</li>`;
    };
    console.log(data);
    waypArr.forEach((loc) => {
      waypts.push({ location: loc, stopover: true });
    });
    console.log(waypArr);
    originCoordinate = data[data.length - 1].origin;
    destinationCoordinate = data[data.length - 1].destination;
    console.log(originCoordinate, destinationCoordinate);

    // initMap();
    clickButton();
  });
  function clickButton () {
    const applyRoute = document.querySelectorAll(".button")[0];
    const skipRoute = document.querySelectorAll(".button")[1];
    const offeredRouteId = query.split("=");
    const matchedPassengers = { passengerRouteId: passengerArr, passengerType: "request", offeredRouteId: offeredRouteId[1] };
    applyRoute.addEventListener("click", () => {
      fetch("/api/1.0/matched-passengers", {
        method: "POST",
        body: JSON.stringify(matchedPassengers),
        headers: new Headers({
          Authorization: "Bearer " + verifyToken,
          "Content-Type": "application/json"
        })
      }).then((response) => {
        return response.json();
      }).catch(error => {
        console.error("Error:", error);
      }).then(response => {
        console.log("Success:", response);
        function notify
        // document.location.href = `drivers-itinerary.html${query}`;
      });
    });
    skipRoute.addEventListener("click", () => {
      document.location.href = `drivers-itinerary.html${query}`;
    });
  }


  // const xhr = new XMLHttpRequest();
  // xhr.open("GET", `/api/1.0/path-suggestion${query}`);
  // xhr.setRequestHeader("authorization", "Bearer " + verifyToken);
  // xhr.onreadystatechange = async () => {
  //   let data = await promiseXhr(xhr);
  //   console.log("data", data);
  //   data = JSON.parse(data);
  // };
  // xhr.send();

  //     const waypAry = [
  //       { lat: 24.978641, lng: 121.550183 },
  //       { lat: 24.978835, lng: 121.551471 },
  //       { lat: 24.980031, lng: 121.554078 },
  //       { lat: 24.985215, lng: 121.554014 },
  //       { lat: 24.989114, lng: 121.552426 },
  //       { lat: 24.998537, lng: 121.553359 },
  //       { lat: 24.999792, lng: 121.554089 },
  //       { lat: 25.006005, lng: 121.558037 },
  //       { lat: 25.013755, lng: 121.553700 },
  //       { lat: 25.017200, lng: 121.550756 }
  //     ];
  //   });
  // const initMap = () => {
  //   const directionsService = new google.maps.DirectionsService();
  //   const directionsRenderer = new google.maps.DirectionsRenderer();
  //   const map = new google.maps.Map(document.getElementById("map"), {
  //     zoom: 8,
  //     center: { lat: 25.0, lng: 121.585 }
  //   });
  //   directionsRenderer.setMap(map);

  //   const request = {
  //     origin: `${originCoordinate}`,
  //     destination: `${destinationCoordinate}`,
  //     waypoints: waypts,
  //     optimizeWaypoints: true,
  //     travelMode: "DRIVING"
  //   };

  //   // 繪製兩點的路線
  //   directionsService.route(request, function (result, status) {
  //     if (status == "OK") {
  //       directionsRenderer.setDirections(result);
  //     } else {
  //       console.log(status);
  //     }
  //   });
  // };
}
