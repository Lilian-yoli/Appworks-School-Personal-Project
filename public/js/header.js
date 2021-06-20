const socket = io();
async function header () {
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
    });

    const response = await fetch("/api/1.0/notification", {
      method: "GET",
      headers: new Headers({
        Authorization: "Bearer " + verifyToken
      })
    });
    const data = await response.json();
    console.log(data);
    if (data.length > 0) {
      const bell = document.getElementById("bell");
      bell.src = "./uploads/images/notificationOn.png";
      const dropdownMenu = document.querySelector(".dropdown-menu");
      for (const i in data) {
        dropdownMenu.innerHTML +=
      `<a href="${data[i].url}" class="dropdown-item" >
      <div class="content" id="dropdown${i}">${data[i].content}</div></a>`;
      }
      const noNotification = document.querySelectorAll(".dropdown-content")[0];
      noNotification.textContent = "";

      for (const i in data) {
        document.addEventListener("click", (e) => {
          if (e.target.id == `dropdown${i}`) {
            console.log(`fire dropdown${i}!!!`);
            console.log(data[i].id);
            socket.emit("updateNotification", { id: data[i].id, targetId: i, userId: data[i].user_id });
          }
        });
      }
    }
  }
  socket.on("removeNotification", data => {
    console.log(data);
    document.getElementById(`dropdown${data.targetId}`).innerHTML = "";
  });

  socket.on("passengerReceive", data => {
    console.log(data);
    const dropdownMenu = document.querySelector(".dropdown-menu");
    dropdownMenu.innerHTML = "";
    if (data.length > 0) {
      const bell = document.getElementById("bell");
      bell.src = "./uploads/images/notificationOn.png";
      for (const i in data) {
        dropdownMenu.innerHTML +=
        `<a href="${data[i].url}" class="dropdown-item">
          <div class="dropdown-content">
            <p class="dropdown-content-p">${data[i].content}</p>
          </div>
        </a>`;
        const dropdownItem = document.querySelectorAll(".dropdown-item")[i];
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

  fetch("api/1.0/user-profile", {
    method: "GET",
    headers: new Headers({
      Authorization: "Bearer " + verifyToken
    })
  }).then((response) => {
    if (!response.ok) {
      return;
    }
    return response.json();
  }).then((data) => {
    console.log(data);

    document.getElementById("username").innerHTML = data.data.name;
    const member = document.getElementById("member");
    member.src = data.data.picture;
    member.style.width = "48px";
  }).catch((error) => {
    console.error("Error:", error);
  });

  const makeRooom = (userId, receiverId) => {
    if (userId > receiverId) {
      return `${receiverId}WITH${userId}`;
    } else {
      return `${userId}WITH${receiverId}`;
    }
  };

  const logout = document.getElementById("logout");
  console.log(logout);
  logout.addEventListener("click", () => {
    localStorage.removeItem("access_token");
    location.href = "./";
  });
}

header();

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
