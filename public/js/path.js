const waypoints = [];
function promiseXhr (xhr) {
  return new Promise((resolve, reject) => {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const data = xhr.responseText;
      resolve(data);
    }
  });
}
const xhr = new XMLHttpRequest();
xhr.open("GET", "/choose-mvp");
xhr.onreadystatechange = async () => {
  let data = await promiseXhr(xhr);
  data = JSON.parse(data).passengerSortByDistance;
  for (const i in data) {
    const waypointsStart = { location: `${data[i][2][0]},${data[i][2][1]}`, stopover: true };
    const waypointsDestination = { location: `${data[i][3][0]},${data[i][3][1]}`, stopover: true };
    waypoints.push(waypointsStart);
    waypoints.push(waypointsDestination);
  }
  console.log(waypoints);
};
xhr.send();

function initMap () {
  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer();
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 16,
    center: { lat: 25.0, lng: 121.585 }
  });
  directionsRenderer.setMap(map);

  const request = {
    origin: "25.046243,121.517475",
    destination: "23.982576, 121.613073",
    waypoints: waypoints,
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
