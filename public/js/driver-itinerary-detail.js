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
  dLocation.innerHTML = `<h4>起點：${data.driversInfo.origin}</h4><h4>終點：${data.driversInfo.destination}</h4>`;
  dDetails.innerHTML = `<h5>人數：${data.driversInfo.available_seats}</h5><h5>日期：${data.driversInfo.date}</h5><h5>時間：${data.driversInfo.time}</h5>`;
}

function createPassengerInfo (data) {
  const passengerInfoArr = data.passengerInfoArr;
  console.log(123);
  for (let i = 0; i < passengerInfoArr.length; i++) {
    console.log(456);
    const pLocation = document.createElement("h5");
    pLocation.className = "name";
    pLocation.innerHTML = `<h5>${passengerInfoArr[i].name}</h5>
    <h5>人數：${passengerInfoArr[i].persons}</h5>`;

    console.log(pLocation);
    const pDetails = document.createElement("div");
    // pDetails.textContent = passengerInfoArr[i].picture;
    // eslint-disable-next-line quotes
    pDetails.innerHTML = `<h2>乘客資訊</h2><img src="../uploads/images/member.png">`;
    pDetails.className = "picture";
    console.log(pDetails);
    passenger.appendChild(pDetails);
    passenger.appendChild(pLocation);
  }
}

window.onload = function () {
  const backToItinerary = document.getElementById("back");
  backToItinerary.addEventListener("click", () => {
    document.location.href = "./driver-itinerary.html";
  });
};
