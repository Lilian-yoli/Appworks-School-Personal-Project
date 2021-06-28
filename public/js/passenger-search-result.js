const query = window.location.search;

window.onload = async function () {
  const driverRoutes = await getDriverRoutes(query);

  const routeInfo = document.getElementById("match-itinerary");
  if (driverRoutes.error) {
    showNoResult(routeInfo);
  } else {
    showSearchResult(driverRoutes, routeInfo);
  }
  homepage();
};

async function getDriverRoutes (query) {
  const response = await fetch(`/api/1.0/search${query}`, {
    method: "GET"
  });
  const data = await response.json();
  return data;
}

async function showNoResult (routeInfo) {
  routeInfo.append(Object.assign(document.createElement("h3"),
    { id: "sign" },
    { textContent: "輸入地點尚無路線，請至「尋找路線」發出需求" }));
  routeInfo.append(Object.assign(document.createElement("img"),
    { id: "sign-pic" },
    { src: "../uploads/images/passenger_nosuitable_route.svg" }));
}

function showSearchResult (data, routeInfo) {
  for (const route of data) {
    routeInfo.innerHTML +=
  `<a class="match-itinerary-container" href="./driver-itinerary-detail.html?routeid=${route.id}">
      <div class="match-itinerary-wrapper">
      <div class="match-itinerary-detail">
          <div class="match-itinerary-date">日期：${route.date}</div>
          <div class="match-itinerary-date">出發時間：${route.time}</div>
          <div class="match-itinerary-seats">${route.seats_left}個人</div>
      </div>
      <div class="match-itinerary-upper">
          <img class="match-itinerary-img-img" src="./uploads/images/route.png">
          <div class="match-itinerary-location">
              <div class="match-itinerary-origin">${route.origin}</div>
              <div class="match-itinerary-destination">${route.destination}</div>
          </div>
        </div>
      </div></a>`;
  }
}

function homepage () {
  const homepage = document.getElementById("homePage");
  homepage.addEventListener("click", () => {
    window.location.href = "./";
  });
}
