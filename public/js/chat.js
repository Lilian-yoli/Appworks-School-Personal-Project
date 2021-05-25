const socket = io();
const verifyToken = localStorage.getItem("access_token");
const query = window.location.search;
// const xhr = new XMLHttpRequest();
// xhr.open("GET", "/api/1.0/get-email");
// xhr.setRequestHeader("authorization", "Bearer " + verifyToken);
// xhr.onreadystatechange = function () {
//   if (xhr.readyState === 4 && xhr.state === 200) {
//     console.log(xhr.responseText);
//   }
// };
// xhr.send();

fetch(`/api/1.0/get-email${query}`, {
  method: "GET",
  headers: new Headers({
    Authorization: "Bearer " + verifyToken
  })
}).then((response) => {
  return response.json();
}).then((data) => {
  console.log(data);
  const sender = data.senderId;
  const receiver = data.receiverId;
  socket.emit("login", { sender });
  const roomInfo = {
    sender: sender,
    receiver: receiver,
    room: `${sender}with${receiver}`
  };
  socket.emit("joinRoom", roomInfo);

  socket.emit("sendMsg", info);
  socket.on("receiveMsg", data => {
    console.log(data);
  });
});
