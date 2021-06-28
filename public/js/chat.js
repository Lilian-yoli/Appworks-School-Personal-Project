const socket = io();
window.onload = async () => {
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
    if (data.error) {
      window.location.href = "./404.html";
    }
    if (data.firstSidebar && data.firstSidebar.length < 1) {
      createChatting(null, data.usersInfo, data.usersInfo.now);
    } else if (!data.firstSidebar) {
      createChatting(data.sidebar, data.usersInfo, null);
    } else {
      createChatting(data.firstSidebar, data.usersInfo, null);
    }
    if (data.sidebar.length > 0) {
      const chatRecord = document.getElementById("chat-record");
      const userId1 = data.usersInfo.userId1;
      const userId2 = data.usersInfo.userId2;
      createChatList2(chatRecord, data.sidebar, userId1, userId2);
    }

    if (data.firstChatMsg) {
      outputMsg(data.usersInfo, data.firstChatMsg);
    } else {
      outputMsg(data.usersInfo, data.chatMsg);
    }

    const chatForm = document.querySelector(".form-control");
    const chatContent = document.getElementById("chat-content");
    chatContent.scrollIntoView(false);
    const send = document.getElementById("send");
    const senderId = data.usersInfo.userId1;
    const senderName = data.usersInfo.username1;
    const senderPic = data.usersInfo.userPicture1;
    const receiverId = data.usersInfo.userId2;
    const receiverName = data.usersInfo.username2;
    const receiverPic = data.usersInfo.userPicture2;
    const room = data.usersInfo.room;
    console.log("sender", senderId);
    socket.emit("login", senderId);

    send.addEventListener("click", (e) => {
      e.preventDefault();
      const msg = chatForm.value;
      console.log(msg);
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

      chatForm.value = "";
      chatForm.focus();
    });

    socket.on("receiveMsg", data => {
      console.log(data);
      outputChattingMsg(data, senderId);
      console.log(receiverName, senderName);
      console.log(receiverId, receiverName);
      const lastChat = document.querySelector(".status");
      if (data.receiverId == senderId) {
        lastChat.innerHTML = `${data.senderName}：${data.msg}`;
      } else {
        lastChat.innerHTML = `你：${data.msg}`;
      }
      chatContent.scrollIntoView(false);
    });
  });
};

const makeLabel = (senderId, receiverId) => {
  if (+senderId < +receiverId) {
    return senderId + "WITH" + receiverId;
  } else {
    return receiverId + "WITH" + senderId;
  }
};

const createChatting = (data, users, time) => {
  const chatting = document.getElementById("chatting");
  if (!time) {
    time = toDateFormat(data[0].time);
  }
  let lastChat = "";
  if (data) {
    if (data[0].sender_id == users.userId1) {
      lastChat = "你：" + data[0].msg;
    } else {
      lastChat = users.username2 + "：" + data[0].msg;
    }
  }

  chatting.innerHTML =
      `<a href="./chat.html?room=${users.room}">  
                    <li class="clearfix">
                        <img src="${users.userPicture2}" alt="avatar">
                        <div class="about">
                          <div class="upper">
                            <div class="name">${users.username2}</div><div class="date">${time}</div>
                          </div>
                          <div class="status">${lastChat}</div><div class="unread"></div>
                        </div>
                    </li>
                    </a>`;
};

const createChatList2 = (chatType, data, userId1, userId2) => {
  for (const i in data) {
    // sidebar chatroom not onchat
    console.log(data[i].receiverUserId, userId2, data[i].senderUserId);
    if (data[i].receiverUserId != userId2 && data[i].senderUserId != userId2) {
      const time = toDateFormat(data[i].time);
      let lastChat = "";
      if (data[i].senderUserId == userId1) {
        lastChat = "你：" + data[i].msg;
        setHTMLOfChatList(chatType, data[i], data[i].receiverUserPicture, data[i].receiverUserName, lastChat, time);
      } else {
        lastChat = data[i].senderUserName + "：" + data[i].msg;
        setHTMLOfChatList(chatType, data[i], data[i].senderUserPicture, data[i].senderUserName, lastChat, time);
      }

      if (data[i].not_read > 0) {
        const unread = document.querySelectorAll(".unread")[i];
        unread.display = "inline-block";
        unread.innerHTML = data[i].not_read;
      }
    }
  }
};

const setHTMLOfChatList = (chatType, data, picture, name, lastChat, time) => {
  chatType.innerHTML +=
      `<a href="./chat.html?room=${data.room}">  
                    <li class="clearfix">
                        <img src="${picture}" alt="avatar">
                        <div class="about">
                          <div class="upper">
                            <div class="name">${name}</div><div class="date">${time}</div>
                          </div>
                          <div class="status">${lastChat}</div><div class="unread"></div>
                        </div>
                    </li>
                    </a>`;
};

// const createChatList = (chatType, data, users, userId) => {
//   for (const i in data) {
//     if (data[0].receiver_id !== userId && data[0].sender_id !== userId) {
//       const chatList = document.querySelector(".chat-list");
//       const onChat = document.createElement("a");
//       onChat.setAttribute("id", chatType);
//       onChat.href = `./chat.html?room=${data[i].room}`;
//       chatList.appendChild(onChat);
//       const listLeft = document.createElement("div");
//       listLeft.classList.add("list-left");
//       onChat.appendChild(listLeft);
//       const profileImg = document.createElement("img");
//       profileImg.classList.add("list-img");
//       profileImg.src = "./uploads/images/member.png";
//       listLeft.appendChild(profileImg);
//       const listRight = document.createElement("div");
//       listRight.classList.add("list-right");
//       onChat.appendChild(listRight);
//       const listRightUp = document.createElement("div");
//       listRightUp.classList.add("list-right-up");
//       listRight.appendChild(listRightUp);
//       const listRightUpP = document.createElement("p");
//       listRightUpP.classList.add("list-right-up-p");
//       listRightUpP.textContent = users.username2;
//       listRightUp.appendChild(listRightUpP);
//       if (data[i].not_read > 0) {
//         const listRightNoti = document.createElement("div");
//         listRightNoti.classList.add("list-right-notification");
//         listRightUp.appendChild(listRightNoti);
//         const listRightNotiP = document.createElement("p");
//         listRightNotiP.classList.add("list-right-notification-num");
//         listRightNotiP.textContent = data[i].not_read;
//         listRightNoti.appendChild("listRightNotiP");
//       }
//       const listRightDown = document.createElement("div");
//       listRightDown.classList.add("list-right-down");
//       listRight.appendChild(listRightDown);
//       const listMsg = document.createElement("div");
//       listMsg.classList.add("list-msg");
//       listRightDown.appendChild(listMsg);
//       const listRightDownP = document.createElement("p");
//       listRightDownP.classList.add("list-right-down-p");
//       if (data[i].sender_id == users.userId1) {
//         listRightDownP.textContent = "你：" + data[i].msg;
//       } else {
//         listRightDownP.textContent = users.username2 + "：" + data[i].msg;
//       }
//       listMsg.appendChild(listRightDownP);
//       const listDate = document.createElement("div");
//       listDate.classList.add("list-date");
//       listRightDown.appendChild(listDate);
//       const listDateP = document.createElement("p");
//       listDateP.classList.add("list-date-p");
//       const time = toDateFormat(data[i].time);
//       listDateP.textContent = time;
//       listDate.appendChild(listDateP);
//     }
//   }
// };

const outputMsg = (users, msg) => {
  const receiverPic = document.getElementById("receiver-pic");
  const receiverName = document.getElementById("receiver-name");
  receiverPic.src = users.userPicture2;
  receiverName.innerHTML = users.username2;
  const chatContent = document.getElementById("chat-content");
  for (const i in msg) {
    chatContent.innerHTML +=
    `<li class="clearfix">
      <div class="message-data" id="msgContainer${i}">
        <img id="profile${i}" alt="avatar">
      </div>
      <div class="message" id="msg${i}">${msg[i].msg}</div>                                    
    </li>`;
    if (msg[i].sender_id == users.userId1) {
      document.getElementById(`profile${i}`).src = users.userPicture1;
      document.getElementById(`msgContainer${i}`).classList.add("text-right");
      document.getElementById(`msg${i}`).classList.add("other-message");
      document.getElementById(`msg${i}`).classList.add("float-right");
      document.getElementById(`msg${i}`).classList.add("chat-color");
    } else {
      document.getElementById(`profile${i}`).src = users.userPicture2;
      document.getElementById(`msg${i}`).classList.add("my-message");
    }
  }
};

const toDateFormat = (fromUnixtime) => {
  const date = fromUnixtime.split("T");
  return date[0];
};

const outputChattingMsg = (data, senderId) => {
  const chatContent = document.getElementById("chat-content");
  const chat = document.createElement("div");
  chat.classList.add("clearfix");
  console.log((data.senderId == senderId), data.senderId, senderId);
  console.log("data.senderPicture", data.senderPicture, "data.receiverPicture", data.receiverPicture);
  if (data.senderId == senderId) {
    chat.innerHTML =
    `<div class="message-data text-right">
      <img src="${data.senderPicture}" alt="avatar">
    </div>
<div class="message other-message float-right">${data.msg}</div>`;
  } else {
    chat.innerHTML =
    `<div class="message-data">
      <img src="${data.senderPicture}" alt="avatar">
    </div>
<div class="message my-message">${data.msg}</div>`;
  }
  chatContent.appendChild(chat);
};
