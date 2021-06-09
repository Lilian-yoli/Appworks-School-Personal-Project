const verifyToken = localStorage.getItem("access_token");
const query = window.location.search;
fetch(`/api/1.0/driver-search${query}`, {
  method: "GET",
  headers: new Headers({
    Authorization: "Bearer " + verifyToken
  })
}).then((response) => {
  return response.json();
}).then((data) => {
  console.log(data);
  for (const i in data) {
    const driverItinerary = document.getElementById("passenger-itinerary");
    const locations = document.createElement("div");
    const details = document.createElement("details");
    const origin = document.createElement("h4");
    const destination = document.createElement("h4");
    const date = document.createElement("h5");
    const availableSeats = document.createElement("h5");
    const time = document.createElement("h5");
    const fee = document.createElement("h5");
    const link = document.createElement("a");
    link.href = `http://localhost:3000/driver-search-detail.html${query}&id=${data[i].route_id}`;
    origin.textContent = "起點：" + data[i].origin;
    destination.textContent = "終點：" + data[i].destination;
    date.textContent = "日期：" + data[i].date;
    availableSeats.textContent = "人數：" + data[i].persons;
    locations.appendChild(origin);
    locations.appendChild(destination);
    details.appendChild(date);
    details.appendChild(time);
    details.appendChild(availableSeats);
    details.appendChild(fee);
    link.appendChild(locations);
    link.appendChild(details);
    driverItinerary.appendChild(link);
  }
// }).catch((error) => {
//   console.error("Error:", error);
});
