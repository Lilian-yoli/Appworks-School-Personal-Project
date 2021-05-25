const socket = io();
const testname = "test";
socket.emit("user_connected", testname);
socket.on("user_connected", function (username) {
  console.log(username);
  let html = "";
  html += `<li>${username}</li>`;
  console.log(html);
  document.getElementById("users").innerHTML += html;
});

// // Message submit
// window.onload = function () {
//   const chatForm = document.getElementById("chat-form");

//   // Message from server
//   socket.on("message", message => {
//     console.log(message);
//     outputMessage(message);
//   });

//   chatForm.addEventListener("submit", (e) => {
//     e.preventDefault();
//     // get message text
//     const msg = e.target.elements.msg.value;
//     // emit message to server
//     socket.emit("chatMessages", msg);
//   });
// };

// // output message to  DOM
// function outputMessage (message) {
//   const div = document.createElement("div");
//   div.classList.add("message");
//   div.innerHTML = `<p class="meta">Brad <span>9:12pm</span></p>
//   <p class="text">
//     ${message}
//   </p>`;
//   document.querySelector(".chat-messages").appendChild(div);
// }
