const verifyToken = localStorage.getItem("access_token");
fetch("/api/1.0/passenger-request-detail", {
  method: "GET",
  headers: new Headers({
    Authorization: "Bearer " + verifyToken
  })
}).then((response) => {
  return response.json();
}).then((data) => {
  console.log(data);
  const itinerary = document.getElementById("itinerary");
  if (data.length < 1) {
    itinerary.innerHTML = "<h3>尚無行程</h3>";
  }
  for (const i in data) {
    itinerary.innerHTML += `<h4>起點：${data[i].origin}</h4>
      <h4>終點：${data[i].destination}</h4>
      <h5>日期：${data[i].date}</h5>
      <h5>人數：${data[i].persons}</h5>`;
  }
});

window.onload = function () {
  const homePage = document.getElementById("homePage");
  homePage.addEventListener("click", () => {
    document.location.href = "./";
  });
};
