
const origin = document.getElementById("origin");
const destination = document.getElementById("destination");
const persons = document.getElementById("persons");
const date = document.getElementById("date");
const time = document.getElementById("time");
const next = document.querySelector(".next");

window.addEventListener("load", () => {
  console.log("test");
  const url = new URL("http://localhost:3000/path.html");
  const searchParams = new URLSearchParams({ id: 1 });
  url.search = searchParams;
  console.log(url.href);
});

const seatsOfferedInfo = {};
next.addEventListener("click", () => {
  if (origin.value == "" || destination.value == "" || persons.value == "" || date.value == "") {
    return alert("出發地、目的地、乘載人數、日期為必填");
  }
  seatsOfferedInfo.origin = origin.value;
  seatsOfferedInfo.destination = destination.value;
  seatsOfferedInfo.persons = persons.value;
  seatsOfferedInfo.date = date.value;
  seatsOfferedInfo.time = time.value;

  const verifyToken = localStorage.getItem("access_token");
  fetch("/api/1.0/offer-seats-info", {
    method: "POST",
    body: JSON.stringify(seatsOfferedInfo),
    headers: new Headers({
      Authorization: "Bearer " + verifyToken,
      "Content-Type": "application/json"
    })
  }).then((response) => {
    return response.json();
  }).catch(error => {
    console.error("Error:", error);
  }).then(response => {
    console.log("Success:", response);
    if (response.error) {
      alert(response.error);
    } else {
      const data = response.route;
      console.log("data46:", data);
      window.localStorage.setItem("route", JSON.stringify(response.route));
      const url = new URL("http://localhost:3000/api/1.0/path.html");
      const searchParams = new URLSearchParams({
        id: response.route.id
      });
      url.search = searchParams;
      console.log(url.href);
      document.location.href = url.href;
    }
  });
});
