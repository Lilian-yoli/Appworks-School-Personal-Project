const query = window.location.search;
const socket = io();
const verifyToken = localStorage.getItem("access_token");

fetch(`/api/1.0/passenger-search-detail${query}`, {
  method: "GET"
}).then((res) => {
  return res.json();
}).then((data) => {
  console.log(data);
  const driverRoute = data.driverRoute;
  if (data.passengerRoute) {
    document.querySelector("h2").innerHTML = "你的行程";
    console.log(document.querySelector("h2").innerHTML = "你的行程");
    const passengerRoute = data.passengerRoute;
    document.getElementById("p-location").innerHTML =
    `<h4>起點：${passengerRoute.origin}</h4>
    <h4>終點：${passengerRoute.destination}</h4>`;
    document.getElementById("p-detail").innerHTML =
    `<h5>日期：${passengerRoute.date}</h5>
    <h5>人數：${passengerRoute.persons}</h5>`;
  }
  document.querySelector(".location").innerHTML =
    `<h4>起點：${driverRoute.origin}</h4>
    <h4>終點：${driverRoute.destination}</h4>`;
  document.querySelector(".detail").innerHTML =
    `<h5>日期：${driverRoute.date}</h5>
    <h5>時間：${driverRoute.time}</h5>
    <h5>人數：${driverRoute.available_seats}</h5>
    <h5>單人費用：${driverRoute.fee}</h5>`;
  document.querySelector(".driver").innerHTML =
  // <div>${data[0].picture}</div>
    `<div><img src="../uploads/images/member.png"></div>
    <div>${driverRoute.name}</div>
    <button id="contact" type="button">聯繫車主</button>`;
  clickEvent(driverRoute, query);
});

const clickEvent = async (driverRoute, query) => {
  let data = "";
  const res = await fetch("/api/1.0/verify", {
    method: "POST",
    body: JSON.stringify({ receiverId: driverRoute.id }),
    headers: new Headers({
      Authorization: "Bearer " + verifyToken,
      "Content-Type": "application/json"
    })
  });
  data = await res.json();
  console.log("verifyAPI:", data);
  socket.emit("login", data.userId);
  const contact = document.getElementById("contact");
  contact.addEventListener("click", async () => {
    const room = makeRooom(data.userId, data.receiverId);
    document.location.href = `./chat.html?room=${room}`;
  });

  const book = document.getElementById("book");
  book.addEventListener("click", async () => {
    const response = await fetch(`/api/1.0/passenger-tour${query}`, {
      method: "POST",
      headers: new Headers({
        Authorization: "Bearer " + verifyToken
      })
    });
    const idInfo = await response.json();
    if (idInfo.error) {
      return alert("當日路線已建立，請至「你的行程」查看");
    }
    console.log(idInfo);
    console.log(idInfo.tourId);
    const routeInfo = {
      receiverId: [driverRoute.id],
      passengerRouteId: null,
      url: `./driver-itinerary-detail.html?routeid=${driverRoute.route_id}&tour=${idInfo.tourId}`,
      content: `乘客${data.username}已接受你的行程，立即前往查看`,
      type: "match",
      icon: "./uploads/images/member.png"
    };
    socket.emit("notifiyPassenger", routeInfo);
    alert("通知已傳送");

    // document.location.href = "./passenger-itinerary.html";
  });
};
// const contact = (receiverId) => {
//   const contact = document.getElementById("contact");
//   contact.addEventListener("click", async () => {
//     const res = await fetch("/api/1.0/verify", {
//       method: "POST",
//       body: JSON.stringify({ receiverId }),
//       headers: new Headers({
//         Authorization: "Bearer " + verifyToken,
//         "Content-Type": "application/json"
//       })
//     });
//     const data = await res.json();
//     console.log(data);
//     const room = makeRooom(data.userId, data.receiverId);
//     document.location.href = `./chat.html?room=${room}`;
//   });
// };

const makeRooom = (userId, receiverId) => {
  if (userId > receiverId) {
    return `${receiverId}WITH${userId}`;
  } else {
    return `${userId}WITH${receiverId}`;
  }
};

const verifytoken = localStorage.getItem("access_token");
if (!verifytoken) {
  document.location.href = "./login.html";
}
window.onload = function () {
  const back = document.getElementById("back");
  back.addEventListener("click", () => {
    document.location.href = document.referrer;
  });

  // book.addEventListener("click", () => {
  //   fetch(`/api/1.0/matched-driver${query}`, {
  //     method: "POST",
  //     headers: new Headers({
  //       Authorization: "Bearer " + verifytoken
  //     })
  //   }).then((response) => {
  //     return response.json();
  //   }).then((data) => {
  //     console.log(data.id);
  //     document.location.href = "./passenger-itinerary.html";
  //   });
  // });
};

// const contact = () => {
//   const button = document.getElementById("contact");
//   button.addEventListener("click", () => {
//     fetch(`/api/1.0/get-id${query}`)
//   })
// };
// const contact = () => {
//   const button = document.getElementById("contact");
//   button.addEventListener("click", () => {
//     console.log(driverEmail);
//     socket.emit("user_connected", driverName);
//     socket.on("user_connected", function (username) {
//       console.log(username);
//       let html = "";
//       html += `<li>${username}</li>`;
//       console.log(html);
//       document.getElementById("user").innerHTML += html;
//     });
//   });
// };
// const sender = "test12";
// const reciever = driverName;
// const sendMessage = () => {
//   // get message
//   const msg = document.getElementById("msg").value;
//   socket.emit("send_message", {
//     sender: sender,
//     reciever: driverName,
//     message: msg
//   });
//   return false;
// };

// // listen from server
// socket.on("new_message", function (data) {
//   console.log(data);
//   let html = "";
//   html += `<li>${data.sender} says: ${data.message}</li>`;
//   document.getElementById("msg").innerHTML = html;
// });
