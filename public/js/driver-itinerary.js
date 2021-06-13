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
  const match = data.match;
  const unmatch = data.unmatch;
  const itinerary = document.getElementById("match-itinerary");
  for (const i in match) {
    itinerary.innerHTML +=
    `<a class="match-itinerary-container" href="./driver-tour-info.html?routid=${match[0].route_id}&tour=${match[0].tourId}">
    <div class="match-itinerary-wrapper">
    <div class="match-itinerary-detail">
        <div class="match-itinerary-date">日期：${match[i].date}</div>
        <div class="match-itinerary-time">時間：${match[i].time}</div>
        <div class="match-itinerary-seats">${match[i].seats_left}個座位</div>
    </div>
    <div class="match-itinerary-upper">
        <img class="match-itinerary-img-img" src="./uploads/images/route.png">
        <div class="match-itinerary-location">
            <div class="match-itinerary-origin">${match[i].origin}</div>
            <div class="match-itinerary-destination">${match[i].destination}</div>
        </div>
    </div>
</div>
</a>`;
  }
  const unmatchItinerary = document.getElementById("unmatch-itinerary");
  for (const i in unmatch) {
    unmatchItinerary.innerHTML +=
    `<a class="unmatch-itinerary-container" href="./driver-tour-info.html?routid=${match[0].route_id}&tour=${match[0].tourId}">
    <div class="match-itinerary-wrapper">
    <div class="match-itinerary-detail">
        <div class="match-itinerary-date">日期：${unmatch[i].date}</div>
        <div class="match-itinerary-time">時間：${unmatch[i].time}</div>
        <div class="match-itinerary-seats">${unmatch[i].seats_left}個座位</div>
    </div>
    <div class="match-itinerary-upper">
        <img class="match-itinerary-img-img" src="./uploads/images/route.png">
        <div class="match-itinerary-location">
            <div class="match-itinerary-origin">${unmatch[i].origin}</div>
            <div class="match-itinerary-destination">${unmatch[i].destination}</div>
        </div>
    </div>
</div>
</a>`;
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
