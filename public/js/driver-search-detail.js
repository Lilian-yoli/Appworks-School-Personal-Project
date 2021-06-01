const query = window.location.search;
const socket = io();
let id = "";
const verifytoken = localStorage.getItem("access_token");
if (!verifytoken) {
  document.location.href = "./login.html";
}
fetch(`/api/1.0/driver-search-detail${query}`, {
  method: "GET"
}).then((response) => {
  return response.json();
}).then((data) => {
  console.log(data);
  id = data[0].id;
  document.querySelector(".location").innerHTML =
    `<h4>起點：${data[0].origin}</h4>
    <h4>終點：${data[0].destination}</h4>`;
  document.querySelector(".detail").innerHTML =
    `<h5>日期：${data[0].date}</h5>
    <h5>人數：${data[0].persons}</h5>`;
  document.querySelector(".driver").innerHTML =
  // <div>${data[0].picture}</div>
    `<div><img src="../uploads/images/member.png"></div>
    <div>${data[0].name}</div>
    <button id="contact" type="button" onclick="contact()">聯繫乘客</button>`;
  localStorage.setItem("passengerId", id);
});
const verifyToken = localStorage.getItem("access_token");
const passengerId = localStorage.getItem("passengerId");
console.log(passengerId);
const contact = () => {
  fetch("/api/1.0/verify", {
    method: "GET",
    headers: new Headers({
      Authorization: "Bearer " + verifyToken
    })
  }).then((response) => {
    return response.json();
  }).then((data) => {
    console.log(data);
    let room = "";
    console.log(passengerId);
    console.log(data.userId);
    if (passengerId > data.userId) {
      room = data.userId + "WITH" + passengerId;
    } else {
      room = passengerId + "WITH" + data.userId;
    }
    console.log(room);
    document.location.href = `./chat.html?room=${room}`;
  });
};

window.onload = function () {
  const back = document.getElementById("back");
  back.addEventListener("click", () => {
    document.location.href = document.referrer;
  });

  const book = document.getElementById("book");
  book.addEventListener("click", () => {
    // fetch(`/api/1.0/matched-passengers${query}`, {
    //   method: "POST",
    //   // body: { {}, passengerType, offeredRouteId }
    //   headers: new Headers({
    //     Authorization: "Bearer " + verifytoken
    //   })
    // }).then((response) => {
    //   return response.json();
    // }).then((data) => {
    //   if (data.error) {
    //     alert("尚未提供此路線");
    //   } else {
    //     console.log(data.id);
    document.location.href = "./";
    //   }
    // });
  });
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
