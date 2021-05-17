
const origin = document.getElementById("origin");
const destination = document.getElementById("destination");
const persons = document.getElementById("persons");
const date = document.getElementById("date");
const time = document.getElementById("time");
const next = document.querySelector(".next");

const seatsRequestInfo = {};
next.addEventListener("click", () => {
  seatsRequestInfo.origin = origin.value;
  seatsRequestInfo.destination = destination.value;
  seatsRequestInfo.persons = persons.value;
  seatsRequestInfo.date = date.value;
  seatsRequestInfo.time = time.value;

  const verifyToken = localStorage.getItem("access_token");
  fetch("/api/1.0/request-seats-info", {
    method: "POST",
    body: JSON.stringify(seatsRequestInfo),
    headers: new Headers({
      Authorization: "Bearer " + verifyToken,
      "Content-Type": "application/json"
    })
  }).then((response) => {
    console.log(response.json());
    return response.json();
  }).then(
    console.log
  );
});
