
window.onload = async () => {
  const socket = io();
  const receiverId = localStorage.getItem("driverId");
  const verifyToken = localStorage.getItem("access_token");
  if (!verifyToken) {
    document.location.href = "./login.html";
  }
  console.log(receiverId);
  if (receiverId) {
    await fetch("/api/1.0/chat", {
      method: "POST",
      body: JSON.stringify({ receiverId }),
      headers: new Headers({
        Authorization: "Bearer " + verifyToken,
        "Content-Type": "application/json"
      })
    }).then((response) => {
      return response.json();
    }).then((data) => {
      console.log(data);
    });
  }
  // fetch("/api/1.0/chat-record", {
  //   method: "GET",
  //   headers: new Headers({
  //     Authorization: "Bearer " + verifyToken
  //   })
  // }).then((response) => {
  //   return response.json();
  // }).then((data) => {
  //   console.log(data);
  // });
  // if (receiver) {
  await fetch("/api/1.0/verify", {
    method: "POST",
    body: JSON.stringify({ receiverId }),
    headers: new Headers({
      Authorization: "Bearer " + verifyToken,
      "Content-Type": "application/json"
    })
  }).then((res) => {
    return res.json();
  }).then((data) => {
    console.log(data);
    localStorage.setItem("usersInfo", JSON.stringify(data));

    const usersInfo = JSON.parse(localStorage.getItem("usersInfo"));
    const senderId = usersInfo.userId;
    const senderName = usersInfo.username;
    let receiverName = usersInfo.receiverName;
    let label = "";
    if (receiverId) {
      label = makeLabel(senderId, receiverId);
    };
    const chatForm = document.getElementById("chat-form");
    const chatContent = document.querySelector(".chat-content");
    console.log("sender", senderId);
    socket.emit("login", senderId);

    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const msg = e.target.elements.msg.value;
      msg.trim();
      if (!msg) {
        return false;
      }
      socket.emit("sendMsg", {
        senderId: senderId,
        senderName: senderName,
        receiverId: receiverId,
        receiverName: receiverName,
        label: label,
        msg: msg
      });
      console.log({
        senderId: senderId,
        senderName: senderName,
        receiverId: receiverId,
        receiverName: receiverName,
        msg: msg
      });
      e.target.elements.msg.value = "";
      e.target.elements.msg.focus();
    });

    socket.on("receiveMsg", data => {
      console.log(data.msg);
      outputMsg(data);
      if (senderId !== data.senderId) {
        receiverId = data.senderId;
        receiverName = data.senderName;
        label = data.label;
      }
      console.log(receiverId, receiverName, label);

      chatContent.scrollTop = chatContent.scrollHeight;
    });

    const outputMsg = (data) => {
      const usersInfo = JSON.parse(localStorage.getItem("usersInfo"));
      const senderId = usersInfo.userId;
      if (data.senderId == senderId) {
        const chatContent = document.querySelector(".chat-content");
        const mainDiv = document.createElement("div");
        mainDiv.classList.add("sender");
        chatContent.appendChild(mainDiv);
        const img = document.createElement("img");
        img.src = "";
        const name = document.createElement("div");
        name.classList.add("name");
        name.innerHTML = `<p class="name-p">${data.senderName}</p>`;
        const content = document.createElement("div");
        content.classList.add("sender-msg-content");
        content.innerHTML = `<p class="msg-p">${data.msg}</p>`;
        mainDiv.appendChild(img);
        mainDiv.appendChild(name);
        mainDiv.appendChild(content);
      } else {
        const chatContent = document.querySelector(".chat-content");
        const mainDiv = document.createElement("div");
        mainDiv.classList.add("receiver");
        chatContent.appendChild(mainDiv);
        const img = document.createElement("img");
        img.src = "";
        const name = document.createElement("div");
        name.classList.add("name");
        name.innerHTML = `<p class="name-p">${data.senderName}</p>`;
        const content = document.createElement("div");
        content.classList.add("receiver-msg-content");
        content.innerHTML = `<p class="msg-p">${data.msg}</p>`;
        mainDiv.appendChild(img);
        mainDiv.appendChild(name);
        mainDiv.appendChild(content);
      }
    };
  });
};

const makeLabel = (senderId, receiverId) => {
  if (+senderId < +receiverId) {
    return senderId + "WITH" + receiverId;
  } else {
    return receiverId + "WITH" + senderId;
  }
};
