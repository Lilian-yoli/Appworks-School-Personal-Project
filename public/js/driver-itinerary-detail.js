const query = window.location.search;
const verifyToken = localStorage.getItem("access_token");
fetch(`/api/1.0/driver-itinerary-detail${query}`, {
  method: "GET",
  headers: new Headers({
    Authorization: "Bearer " + verifyToken,
    "Content-Type": "application/json"
  })
}).then((response) => {
  return response.json();
}).then((data) => {
  console.log(data);
  if (!data.passengerInfoArr) {
    createDriverInfo(data);
  } else {
    createDriverInfo(data);
    createPassengerInfo(data);
  }
});

const dLocation = document.querySelector(".locations");
const dDetails = document.querySelector(".details");
const passenger = document.querySelector(".passengers");

function createDriverInfo (data) {
  dLocation.innerHTML = `<h4>${data.driversInfo.origin}</h4><h4>${data.driversInfo.destination}</h4>`;
  dDetails.innerHTML = `<h6>${data.driversInfo.available_seats}</h6><h6>${data.driversInfo.date}</h6><h6>${data.driversInfo.time}</h6>`;
}

function createPassengerInfo (data) {
  const passengerInfoArr = data.passengerInfoArr;
  console.log(123);
  for (let i = 0; i < passengerInfoArr.length; i++) {
    console.log(456);
    const pLocation = document.createElement("div");
    pLocation.className = "name";
    pLocation.textContent = passengerInfoArr[i].name;
    console.log(pLocation);
    const pDetails = document.createElement("div");
    pDetails.textContent = passengerInfoArr[i].picture;
    pDetails.className = "picture";
    console.log(pDetails);
    passenger.appendChild(pLocation);
  }
}

const backToItinerary = document.getElementById("button");
backToItinerary.addEventListener("click", () => {
  document.location.href = "./driver-itinerary.html";
});
