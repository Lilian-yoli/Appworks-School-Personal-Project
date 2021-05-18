
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

  let originLatLon, destinationLatLon;

  console.log(window.location.search);
  const query = window.location.search;
  const verifyToken = localStorage.getItem("access_token");

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

    for (let i = 0; i < data.length - 1; i++) {
      waypArr.push(JSON.parse(data[i][1].origin_lat_lon));
      waypArr.push(JSON.parse(data[i][1].destination_lat_lon));
      const pathSuggestion = document.getElementById("path-suggestion");
      pathSuggestion.innerHTML += `<li>乘客${i + 1}: ${data[i][1].origin} 到 ${data[i][1].destination}</li>`;
    }
    ;
    waypArr.forEach((loc) => {
      waypts.push({ location: loc, stopover: true });
    });
    originLatLon = data[data.length - 1].origin;
    destinationLatLon = data[data.length - 1].destination;
    console.log(originLatLon, destinationLatLon);
    initMap();
  });
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
  const initMap = () => {
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    const map = new google.maps.Map(document.getElementById("map"), {
      zoom: 8,
      center: { lat: 25.0, lng: 121.585 }
    });
    directionsRenderer.setMap(map);

    const request = {
      origin: `${originLatLon}`,
      destination: `${destinationLatLon}`,
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
  };
}
