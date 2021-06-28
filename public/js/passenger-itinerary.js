const verifytoken = localStorage.getItem("access_token");
fetch("/api/1.0/passenger-itinerary", {
  method: "GET",
  headers: new Headers({
    Authorization: "Bearer " + verifytoken
  })
}).then((response) => {
  return response.json();
}).then((data) => {
  if (data.error) {
    swal({
      text: data.error,
      icon: "warning"
    });
    window.location.href = "./";
  }

  const match = data.matched;
  const unmatch = data.unmatched;
  const itinerary = document.getElementById("match-itinerary");
  if (!match.empty) {
    for (const i in match) {
      itinerary.innerHTML +=
      `<a class="match-itinerary-container" href="./driver-tour-info.html?
      routeid=${match[0].id}&tour=${match[0].tourId}&passenger=${match[0].id}">
      <div class="match-itinerary-wrapper">
      <div class="match-itinerary-detail">
          <div class="match-itinerary-date">日期：${match[i].date}</div>
          <div class="match-itinerary-seats">${match[i].persons}個人</div>
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
  } else {
    itinerary.innerHTML =
    `<div width="100%" style="margin-right: auto; margin-left: auto;">
    <h4 style="text-align:center">${match.empty}</h4>
    <img src="../uploads/images/passenger_nosuitable_route.svg" width="480"></div>`;
  }

  const unmatchItinerary = document.getElementById("unmatch-itinerary");
  if (!unmatch.empty) {
    for (const i in unmatch) {
      unmatchItinerary.innerHTML +=
    `<a class="unmatch-itinerary-container" href="./passenger-itinerary-detail.html?routeid=${unmatch[0].id}">
      <div class="match-itinerary-wrapper">
        <div class="match-itinerary-detail">
            <div class="match-itinerary-date">日期：${unmatch[i].date}</div>
            <div class="match-itinerary-seats">${unmatch[i].persons}個人</div>
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
  } else {
    unmatchItinerary.innerHTML =
    `<div width="100%" style="margin-right: auto; margin-left: auto;">
    <h4 style="text-align:center">${unmatch.empty}</h4>
    <img src="../uploads/images/passenger_nosuitable_route.svg" width="480"></div>`;
  }
});

window.onload = function () {
  const homePage = document.getElementById("homePage");
  homePage.addEventListener("click", () => {
    document.location.href = "./";
  });
};
