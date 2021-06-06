const socket = io({ transports: ["websocket"] });

const verifyToken = localStorage.getItem("access_token");
if (verifyToken) {
  fetch("/api/1.0/verify", {
    method: "POST",
    headers: new Headers({
      Authorization: "Bearer " + verifyToken
    })
  }).then((res) => {
    return res.json();
  }).then((data) => {
    console.log(data);
    if (data.error) {
      return;
    }
    socket.emit("login", data.userId);
    console.log(123);
  });
}

socket.on("passengerReceive", data => {
  console.log(data);
  if (data.length) {
    for (const i in data) {
      const dropdown = document.querySelector(".dropdown-menu");
      dropdown.append(Object.assign(document.createElement("a"),
        { className: "dropdown-item" },
        { href: data[i].url }));
      const dropdownItem = document.querySelectorAll(".dropdown-item")[i];
      dropdownItem.append(Object.assign(document.createElement("img"),
        { className: "dropdown-icon" },
        { src: data[i].icon }));
      const dropdownIcon = document.querySelectorAll(".dropdown-icon")[i];
      dropdownItem.append(Object.assign(document.createElement("div"),
        { className: "dropdown-content" }));
      const dropdownContent = document.querySelectorAll(".dropdown-content")[i];
      dropdownContent.append(Object.assign(document.createElement("p"),
        { className: "dropdown-content-p" },
        { textContent: data[i].content }));

      dropdownItem.onclick = function updateNotification () {
        fetch("/api/1.0/update-notification", {
          method: "POST",
          body: JSON.stringify({ url: data[i].url }),
          headers: new Headers({
            Authorization: "Bearer " + verifyToken,
            "Content-Type": "application/json"
          })
        }).then((res) => {
          res.json();
        }).then((data) => {
          console.log(data);
        });
      };
    }
  }
});

const makeRooom = (userId, receiverId) => {
  if (userId > receiverId) {
    return `${receiverId}WITH${userId}`;
  } else {
    return `${userId}WITH${receiverId}`;
  }
};
// function updateNotification () {
//   console.log(window.event);
//   // const dropdownItem = document.querySelectorAll(".dropdown-item");
//   // console.log(dropdownItem);
//   // console.log(dropdownItem[0]);
//   // for (const i in dropdownItem) {
//   // console.log(dropdownItem);
//   // this.addEventListener("click", async (e) => {
//   fetch("/api/1.0/update-notification", {
//     method: "POST",
//     body: JSON.stringify({ url: window.event.target.src }),
//     headers: new Headers({
//       Authorization: "Bearer " + verifyToken,
//       "Content-Type": "application/json"
//     })
//   }).then((res) => {
//     res.json();
//   }).then((data) => {
//     console.log(data);
//   });
// };
// }
