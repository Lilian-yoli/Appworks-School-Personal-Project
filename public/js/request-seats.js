
const origin = document.getElementById("origin");
const destination = document.getElementById("destination");
const persons = document.getElementById("persons");
const date = document.getElementById("date");
const next = document.querySelector(".next");

const seatsRequestInfo = {};
next.addEventListener("click", () => {
  seatsRequestInfo.origin = origin.value;
  seatsRequestInfo.destination = destination.value;
  seatsRequestInfo.persons = persons.value;
  seatsRequestInfo.date = date.value;

  const verifyToken = localStorage.getItem("access_token");
  fetch("/api/1.0/request-seats-info", {
    method: "POST",
    body: JSON.stringify(seatsRequestInfo),
    headers: new Headers({
      Authorization: "Bearer " + verifyToken,
      "Content-Type": "application/json"
    })
  }).then((response) => {
    console.log(123);
    return response.json();
  }).catch(error => console.error("Error:", error))
    .then(response => console.log("Success:", response));
});
