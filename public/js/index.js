const socket = io();
window.onload = function () {
  const origin = document.getElementById("origin");
  const destination = document.getElementById("destination");
  const date = document.getElementById("date");
  const persons = document.getElementById("persons");
  const next = document.getElementById("btn");
  next.addEventListener("click", () => {
    const url = new URL("http://localhost:3000/passenger-search-result.html");
    console.log(persons.value);
    const searchParams = new URLSearchParams({
      origin: origin.value,
      destination: destination.value,
      date: date.value,
      persons: persons.value
    });

    url.search = searchParams;
    console.log(url.href);
    document.location.href = url.href;
  });
  const verifyToken = localStorage.getItem("access_token");
  if (!verifyToken) {
    return null;
  } else {
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
      socket.emit("login", data.userId + "s");
      console.log(123);
    });
  }
  socket.on("notify", data => {
    console.log(data);
  });
};
