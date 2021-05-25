const verifyToken = localStorage.getItem("access_token");
if (!verifyToken) {
  document.location.href = "./login.html";
}
const origin = document.getElementById("origin");
const destination = document.getElementById("destination");
const persons = document.getElementById("persons");
const date = document.getElementById("date");
const next = document.getElementById("next");
// fetch("/api/1.0/verify", {
//   method: "GET",
//   headers: new Headers({
//     Authorization: "Bearer " + verifyToken
//   })
// }).then((res) => {
//   return res.json();
// }).then((res) => {
//   if (res.status == 403 || res.status == 401) {
//     document.location.href = "./login.html";
//   }
// });
const seatsRequestInfo = {};
window.onload = function () {
  next.addEventListener("click", () => {
    seatsRequestInfo.origin = origin.value;
    seatsRequestInfo.destination = destination.value;
    seatsRequestInfo.persons = persons.value;
    seatsRequestInfo.date = date.value;

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
      .then(response => {
        console.log("Success:", response);
        document.location.href = "./passenger-request-detail.html";
      });
  });
};
