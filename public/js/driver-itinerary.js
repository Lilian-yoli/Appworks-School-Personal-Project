const verifyToken = localStorage.getItem("access_token");

fetch("/api/1.0/driver-itinerary", {
  method: "GET",
  headers: new Headers({
    Authorization: "Bearer " + verifyToken
  })
}).then((response) => {
  return response.json();
}).then((data) => {
  console.log(data);
  for (const i in data) {
    const driverItinerary = document.getElementById("itinerary");
    const locations = document.createElement("div");
    const details = document.createElement("details");
    const origin = document.createElement("h4");
    const destination = document.createElement("h4");
    const date = document.createElement("h5");
    const availableSeats = document.createElement("h5");
    const time = document.createElement("h5");
    const fee = document.createElement("h5");
    const link = document.createElement("a");
    link.href = `http://localhost:3000/driver-itinerary-detail.html?routeid=${data[i].route_id}`;
    origin.textContent = "起點：" + data[i].origin;
    destination.textContent = "終點：" + data[i].destination;
    date.textContent = "日期：" + data[i].date;
    availableSeats.textContent = "空餘車位：" + data[i].available_seats;
    time.textContent = "時間：" + data[i].time;
    fee.textContent = "費用：" + data[i].fee;
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
}).catch((error) => {
  console.error("Error:", error);
});

window.onload = function () {
  const homePage = document.getElementById("homePage");
  homePage.addEventListener("click", () => {
    document.location.href = "./";
  });
};
