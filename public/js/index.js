window.onload = function () {
  const origin = document.getElementById("origin");
  const destination = document.getElementById("destination");
  const date = document.getElementById("date");
  const persons = document.getElementById("persons");
  const next = document.getElementById("btn");
  next.addEventListener("click", () => {
    const url = new URL("http://localhost:3000/passenger-search-result.html");
    console.log(persons.value);
    const searchParams = new URLSearchParams({
      origin: origin.value,
      destination: destination.value,
      date: date.value,
      persons: persons.value
    });

    url.search = searchParams;
    console.log(url.href);
    document.location.href = url.href;
  });

  fetch("/api/1.0/passenger-homepage", { method: "GET" })
    .then((res) => {
      return res.json();
    }).then((data) => {
      console.log(data);
      const { route } = data;
      for (const i in route) {
        const passengerRoute = document.querySelector(".passenger-route");
        passengerRoute.innerHTML +=
        `<div class="route-detail">
          <div class="head">
              <div class="date">${route[i].date}</div>
              <div class="persons">${route[i].persons}人</div>
          </div>
          <div class="route-photo">
            <img src="${route[i].photo}">
          </div>
          <div class="route-location">   
            <div class="origin">${route[i].origin}</div>
            <div class="direction">
                <img src="../uploads/images/right-arrow.png" alt="">
            </div>
                <div class="destination">${route[i].destination}</div>
            </div>
          </div>
        </div>`;
      //   passengerRoute.append(Object.assign(document.createElement("div"),
      //     { class: "route-detail" }));
      //   const routeDetail = document.querySelectorAll("route-detail")[i];
      //   routeDetail.append(Object.assign(document.createElement("div"),
      //     { class: "head" }));
      //   const head = document.querySelectorAll(".passenger-route")[i];
      //   head.append(Object.assign(document.createElement("div"),
      //     { class: "date" },
      //     { textContent: route[i].date }));
      //   head.append(Object.assign(document.createElement("div"),
      //     { class: "persons" },
      //     { textContent: route[i].persons }));
      //   routeDetail.append(Object.assign(document.createElement("div"),
      //     { class: "route-photo" }));
      //   const routePhoto = document.querySelectorAll(".route-photo")[i];
      //   routePhoto.append(Object.assign(document.createElement("img"),
      //     { src: route[i].photo }));
      //   routeDetail.append(Object.assign(document.createElement("div"),
      //     { class: "route-location" }));
      //   const routeLocation = document.querySelectorAll(".route-location")[i];
      //   routeLocation.append(Object.assign(document.createElement("div"),
      //     { class: "origin" },
      //     { textContent: route[i].origin }));
      //   routeLocation.append(Object.assign(document.createElement("div"),
      //     { class: "direction" }));
      //   const direction = document.querySelectorAll(".direction")[i];
      //   direction.append(Object.assign(document.createElement("img"),
      //     { src: "../uploads/images/right-arrow.png" }));
      //   routeLocation.append(Object.assign(document.createElement("div"),
      //     { class: "destination" },
      //     { textContent: route[i].destination }));
      }
    });
  fetch("/api/1.0/driver-homepage", { method: "GET" })
    .then((res) => {
      return res.json();
    }).then((data) => {
      console.log(data);
      const { route } = data;
      for (const i in route) {
        const passengerRoute = document.querySelector(".driver-route");
        passengerRoute.innerHTML +=
        `<div class="route-detail">
          <div class="head">
              <div class="date">${route[i].date}</div>
              <div class="persons">${route[i].seats_left}人</div>
          </div>
          <div class="route-photo">
            <img src="${route[i].photo}">
          </div>
          <div class="route-location">   
            <div class="origin">${route[i].origin}</div>
            <div class="direction">
                <img src="../uploads/images/right-arrow.png" alt="">
            </div>
                <div class="destination">${route[i].destination}</div>
            </div>
          </div>
        </div>`;
      }
    });
};
