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
      window.location.href = "./public/404.html";
    }
    if (data.empty) {
      const chatbox = document.getElementById("chatbox");
      return chatbox.append(Object.assign(document.createElement("img"),
        { id: "chat-img" },
        { src: "./uploads/images/Chat.png" }));
    } else if (data.firstSidebar && data.firstSidebar.length < 1) {
      createChatting(null, data.usersInfo, data.usersInfo.now);
    } else if (!data.firstSidebar && data.sidebar.length > 0) {
      createChatting(data.sidebar, data.usersInfo, null);
    } else if (!data.firstSidebar && data.sidebar.length == 0) {
      createChatting(null, data.usersInfo, data.usersInfo.now);
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

    socket.emit("login", senderId);

    send.addEventListener("click", (e) => {
      e.preventDefault();
      const msg = chatForm.value;
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
