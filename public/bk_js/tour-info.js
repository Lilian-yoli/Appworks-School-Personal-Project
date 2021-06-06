
const query = window.location.search;
const socket = io();
const verifyToken = localStorage.getItem("access_token");
console.log(query);
window.onload = async function () {
  const res = await fetch(`/api/1.0/tour-info${query}`, {
    method: "GET",
    headers: new Headers({
      Authorization: "Bearer " + verifyToken
    })
  });
  const data = await res.json();
  console.log(data);
  const { driverInfo, passengerInfo } = data;

  if (data.userId == passengerInfo.id) {
    document.querySelectorAll("h2").innerHTML = "你的行程";
    document.getElementById("a-location").innerHTML =
      `<h4>起點：${passengerInfo.origin}</h4>
      <h4>終點：${passengerInfo.destination}</h4>`;
    document.getElementById("a-detail").innerHTML =
      `<h5>日期：${passengerInfo.date}</h5>
      <h5>人數：${passengerInfo.persons}</h5>`;

    document.getElementById("b-location").innerHTML =
      `<h4>起點：${driverInfo.origin}</h4>
        <h4>終點：${driverInfo.destination}</h4>`;
    document.getElementById("b-location").innerHTML =
      `<h5>日期：${driverInfo.date}</h5>
      <h5>時間：${driverInfo.time}</h5>
      <h5>人數：${driverInfo.seats_left}</h5>
      <h5>單人費用：${driverInfo.fee}</h5>`;
    document.getElementById("b-role").innerHTML =
      // <div>${data[0].picture}</div>
      `<div><img src="../uploads/images/member.png"></div>
      <div>${driverInfo.name}</div>
      <button id="contact" type="button">聯繫車主</button>`;
  } else {
    document.querySelectorAll("h2")[0].innerHTML = "你的行程";
    document.getElementById("a-location").innerHTML =
      `<h4>起點：${driverInfo.origin}</h4>
        <h4>終點：${driverInfo.destination}</h4>`;
    document.getElementById("a-detail").innerHTML =
      `<h5>日期：${driverInfo.date}</h5>
      <h5>時間：${driverInfo.time}</h5>
      <h5>人數：${driverInfo.seats_left}</h5>
      <h5>單人費用：${driverInfo.fee}</h5>`;

    document.getElementById("b-location").innerHTML =
      `<h4>起點：${passengerInfo.origin}</h4>
      <h4>終點：${passengerInfo.destination}</h4>`;
    document.getElementById("b-detail").innerHTML =
      `<h5>日期：${passengerInfo.date}</h5>
      <h5>人數：${passengerInfo.persons}</h5>`;
    document.getElementById("b-role").innerHTML =
      // <div>${data[0].picture}</div>
      `<div><img src="../uploads/images/member.png"></div>
      <div>${passengerInfo.name}</div>
      <button id="contact" type="button">聯繫乘客</button>`;
  }

  // const driverRoute = data.driverRoute;
  // if (data.passengerRoute) {
  //   document.querySelector("h2").innerHTML = "你的行程";
  //   console.log(document.querySelector("h2").innerHTML = "你的行程");
  //   const passengerRoute = data.passengerRoute;
  //   document.getElementById("p-location").innerHTML =
  //     `<h4>起點：${passengerRoute.origin}</h4>
  //     <h4>終點：${passengerRoute.destination}</h4>`;
  //   document.getElementById("p-detail").innerHTML =
  //     `<h5>日期：${passengerRoute.date}</h5>
  //     <h5>人數：${passengerRoute.persons}</h5>`;
  // }
  // document.querySelector(".location").innerHTML =
  //     `<h4>起點：${driverRoute.origin}</h4>
  //     <h4>終點：${driverRoute.destination}</h4>`;
  // document.querySelector(".detail").innerHTML =
  //     `<h5>日期：${driverRoute.date}</h5>
  //     <h5>時間：${driverRoute.time}</h5>
  //     <h5>人數：${driverRoute.available_seats}</h5>
  //     <h5>單人費用：${driverRoute.fee}</h5>`;
  // document.querySelector(".driver").innerHTML =
  //   // <div>${data[0].picture}</div>
  //     `<div><img src="../uploads/images/member.png"></div>
  //     <div>${driverRoute.name}</div>
  //     <button id="contact" type="button">聯繫車主</button>`;
  // clickEvent(driverRoute, query);

// const clickEvent = (driverRoute, query) => {
//   const book = document.getElementById("book");
//   book.addEventListener("click", async () => {
//     const res = await fetch(`/api/1.0/match${query}`, {
//       method: "POST",
//       headers: new Headers({
//         Authorization: "application/json"
//       })
//     });
//     const data = await res.json();
//   });
// };
};
