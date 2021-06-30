window.onload = function () {
  const origin = document.getElementById("origin");
  const destination = document.getElementById("destination");
  const date = document.getElementById("date");
  const persons = document.getElementById("persons");
  const next = document.getElementById("btn");
  next.addEventListener("click", () => {
    const url = new URL("https://www.co-car.site/passenger-search-result.html");

    const searchParams = new URLSearchParams({
      origin: origin.value,
      destination: destination.value,
      date: date.value,
      persons: persons.value
    });

    url.search = searchParams;

    document.location.href = url.href;
  });

  fetch("/api/1.0/passenger-homepage", { method: "GET" })
    .then((res) => {
      return res.json();
    }).then((data) => {
      if (data.error) {
        window.location.href = "./";
      }
      const routes = data.routes;
      let counter = 0;
      for (const route of routes) {
        if (!route.photo) {
          continue;
        }
        counter++;
        if (counter > 4) {
          break;
        }
        const passengerRoute = document.querySelector(".passenger-route");
        passengerRoute.innerHTML +=
        `<div class="route-detail">
        <a class="detail-link" href="./passenger-itinerary-detail.html?routeid=${route.id}">
          <div class="head">
              <div class="date">${route.date}</div>
              <div class="persons">${route.persons}人</div>
          </div>
          <div class="route-photo">
            <img src="${route.photo}">
          </div>
          <div class="route-location">
            <div class="origin">${route.origin}</div>
            <div class="direction">
                <img src="../uploads/images/right-arrow.png" alt="">
            </div>
                <div class="destination">${route.destination}</div>
            </div>
          </div></a>
        </div>`;
      }
    });
  fetch("/api/1.0/driver-homepage", { method: "GET" })
    .then((res) => {
      return res.json();
    }).then((data) => {
      if (data.error) {
        window.location.href = "./";
      }
      const { routes } = data;
      for (const route of routes) {
        const passengerRoute = document.querySelector(".driver-route");
        passengerRoute.innerHTML +=
        `<div class="route-detail">
        <a class="detail-link" href="./driver-itinerary-detail.html?routeid=${route.id}">
          <div class="head">
              <div class="date">${route.date}</div>
              <div class="persons">${route.seats_left}人</div>
          </div>
          <div class="route-photo">
            <img src="${route.photo}">
          </div>
          <div class="route-location">
            <div class="origin">${route.origin}</div>
            <div class="direction">
                <img src="../uploads/images/right-arrow.png" alt="">
            </div>
                <div class="destination">${route.destination}</div>
            </div>
          </div></a>
        </div>`;
      }
    });
};
