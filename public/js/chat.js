
window.onload = async () => {
  const socket = io();
  const query = location.search;
  const verifyToken = localStorage.getItem("access_token");
  if (!verifyToken) {
    document.location.href = "./login.html";
  }

  // 1. when click on somebody to chat
  await fetch(`/api/1.0/chat${query}`, {
    method: "POST",
    headers: new Headers({
      Authorization: "Bearer " + verifyToken,
      "Content-Type": "application/json"
    })
  }).then((response) => {
    return response.json();
  }).then((data) => {
    console.log(data);
    if (data.firstSidebar) {
      console.log(123);
      createChatList("on-chat", data.firstSidebar, data.usersInfo, 0);
      const userId = data.usersInfo.userId2;
      createChatList("chat-record", data.sidebar, data.usersInfo, userId);
    } else {
      createChatList("chat-record", data.sidebar, data.usersInfo, 0);
    }

    if (data.firstChatMsg) {
      outputMsg(data.usersInfo, data.firstChatMsg);
    } else {
      outputMsg(data.usersInfo, data.chatMsg);
    }

    const chatForm = document.getElementById("chat-form");
    const chatContent = document.querySelector(".chat-content");
    const senderId = data.usersInfo.userId1;
    const senderName = data.usersInfo.username1;
    const senderPic = data.usersInfo.userPicture1;
    const receiverId = data.usersInfo.userId2;
    const receiverName = data.usersInfo.username2;
    const receiverPic = data.usersInfo.userPicture2;
    const room = data.usersInfo.room;
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
        senderPicture: senderPic,
        receiverPicture: receiverPic,
        msg: msg,
        room: room
      });

      e.target.elements.msg.value = "";
      e.target.elements.msg.focus();
    });

    socket.on("receiveMsg", data => {
      console.log(data.msg);
      outputChattingMsg(data, senderId);
      console.log(receiverName, senderName);
      console.log(receiverId, receiverName);

      chatContent.scrollTop = chatContent.scrollHeight;
    });
  });
  // 2. simply enter chatroom, not yet chatted to anyone
  // fetch(`/api/1.0/chat-record${query}`, {
  //   method: "POST",
  //   headers: new Headers({
  //     Authorization: "Bearer " + verifyToken,
  //   })
  // }).then((response) => {
  //   return response.json();
  // }).then((data) => {
  //   console.log(data);
  //   createChatList("chat-record", data.sidebar);
  //   localStorage.setItem(
  //   if (!query) {
  //     outputMsg(data.sidebar, data.chatbox);
  //   }
  // });
  // if (receiver) {
};

const makeLabel = (senderId, receiverId) => {
  if (+senderId < +receiverId) {
    return senderId + "WITH" + receiverId;
  } else {
    return receiverId + "WITH" + senderId;
  }
};

const createChatList = (chatType, data, users, userId) => {
  for (const i in data) {
    if (data[0].receiver_id !== userId && data[0].sender_id !== userId) {
      const chatList = document.querySelector(".chat-list");
      const onChat = document.createElement("a");
      onChat.setAttribute("id", chatType);
      onChat.href = `./chat.html?room=${data[i].room}`;
      chatList.appendChild(onChat);
      const listLeft = document.createElement("div");
      listLeft.classList.add("list-left");
      onChat.appendChild(listLeft);
      const profileImg = document.createElement("img");
      profileImg.classList.add("list-img");
      profileImg.src = "./uploads/images/member.png";
      listLeft.appendChild(profileImg);
      const listRight = document.createElement("div");
      listRight.classList.add("list-right");
      onChat.appendChild(listRight);
      const listRightUp = document.createElement("div");
      listRightUp.classList.add("list-right-up");
      listRight.appendChild(listRightUp);
      const listRightUpP = document.createElement("p");
      listRightUpP.classList.add("list-right-up-p");
      listRightUpP.textContent = users.username2;
      listRightUp.appendChild(listRightUpP);
      if (data[i].not_read > 0) {
        const listRightNoti = document.createElement("div");
        listRightNoti.classList.add("list-right-notification");
        listRightUp.appendChild(listRightNoti);
        const listRightNotiP = document.createElement("p");
        listRightNotiP.classList.add("list-right-notification-num");
        listRightNotiP.textContent = data[i].not_read;
        listRightNoti.appendChild("listRightNotiP");
      }
      const listRightDown = document.createElement("div");
      listRightDown.classList.add("list-right-down");
      listRight.appendChild(listRightDown);
      const listMsg = document.createElement("div");
      listMsg.classList.add("list-msg");
      listRightDown.appendChild(listMsg);
      const listRightDownP = document.createElement("p");
      listRightDownP.classList.add("list-right-down-p");
      if (data[i].sender_id == users.userId1) {
        listRightDownP.textContent = "你：" + data[i].msg;
      } else {
        listRightDownP.textContent = users.username2 + "：" + data[i].msg;
      }
      listMsg.appendChild(listRightDownP);
      const listDate = document.createElement("div");
      listDate.classList.add("list-date");
      listRightDown.appendChild(listDate);
      const listDateP = document.createElement("p");
      listDateP.classList.add("list-date-p");
      const time = toDateFormat(data[i].time);
      listDateP.textContent = time;
      listDate.appendChild(listDateP);
    }
  }
};

const outputMsg = (users, msg) => {
  for (const i in msg) {
    if (msg[i].sender_id == users.userId1) {
      const chatContent = document.querySelector(".chat-content");
      const mainDiv = document.createElement("div");
      mainDiv.classList.add("sender");
      chatContent.appendChild(mainDiv);
      const content = document.createElement("div");
      content.classList.add("sender-msg-content");
      content.innerHTML = `<p class="msg-p">${msg[i].msg}</p>`;
      mainDiv.appendChild(content);
    } else {
      const chatContent = document.querySelector(".chat-content");
      const mainDiv = document.createElement("div");
      mainDiv.classList.add("receiver");
      chatContent.appendChild(mainDiv);
      const img = document.createElement("img");
      img.src = `${users.userPicture2}`;
      const name = document.createElement("div");
      name.classList.add("name");
      name.innerHTML = `<p class="name-p">${users.username2}</p>`;
      const content = document.createElement("div");
      content.classList.add("receiver-msg-content");
      content.innerHTML = `<p class="msg-p">${msg[i].msg}</p>`;
      mainDiv.appendChild(img);
      mainDiv.appendChild(name);
      mainDiv.appendChild(content);
    }
  }
};

const toDateFormat = (fromUnixtime) => {
  const date = fromUnixtime.split("T");
  return date[0];
};

const outputChattingMsg = (data, senderId) => {
  if (data.senderId == senderId) {
    const chatContent = document.querySelector(".chat-content");
    const mainDiv = document.createElement("div");
    mainDiv.classList.add("sender");
    chatContent.appendChild(mainDiv);
    const content = document.createElement("div");
    content.classList.add("sender-msg-content");
    content.innerHTML = `<p class="msg-p">${data.msg}</p>`;
    mainDiv.appendChild(content);
  } else {
    const chatContent = document.querySelector(".chat-content");
    const mainDiv = document.createElement("div");
    mainDiv.classList.add("receiver");
    chatContent.appendChild(mainDiv);
    const img = document.createElement("img");
    img.src = `${data.senderPicture}`;
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
