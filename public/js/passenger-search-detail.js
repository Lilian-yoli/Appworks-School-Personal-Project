const query = window.location.search;
const socket = io();
let driverEmail;
let driverName;
fetch(`/api/1.0/passenger-search-detail${query}`, {
  method: "GET"
}).then((response) => {
  return response.json();
}).then((data) => {
  console.log(data);
  driverEmail = data[0].driver_email;
  driverName = data[0].name;
  document.querySelector(".location").innerHTML =
    `<h4>起點：${data[0].origin}</h4>
    <h4>終點：${data[0].destination}</h4>`;
  document.querySelector(".detail").innerHTML =
    `<h5>日期：${data[0].date}</h5>
    <h5>時間：${data[0].time}</h5>
    <h5>人數：${data[0].available_seats}</h5>
    <h5>單人費用：${data[0].fee}</h5>`;
  document.querySelector(".driver").innerHTML =
  // <div>${data[0].picture}</div>
    `<div><img src="../uploads/images/member.png"></div>
    <div>${data[0].name}</div>
    <button id="contact" type="button" onclick="contact()">聯繫車主</button>`;
});
const contact = () => {
  const button = document.getElementById("contact");
  button.addEventListener("click", () => {
    document.location.href = "./chat.html";
  });
};

const verifytoken = localStorage.getItem("access_token");
window.onload = function () {
  const back = document.getElementById("back");
  back.addEventListener("click", () => {
    document.location.href = document.referrer;
  });
  const book = document.getElementById("book");
  book.addEventListener("click", () => {
    fetch(`/api/1.0/matched-driver${query}`, {
      method: "POST",
      headers: new Headers({
        Authorization: "Bearer " + verifytoken
      })
    }).then((response) => {
      return response.json();
    }).then((data) => {
      console.log(data.id);
      document.location.href = "./passenger-itinerary.html";
    });
  });
};

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
