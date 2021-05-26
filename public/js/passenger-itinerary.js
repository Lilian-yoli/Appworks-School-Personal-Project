const verifytoken = localStorage.getItem("access_token");
fetch("/api/1.0/passenger-itinerary", {
  method: "GET",
  headers: new Headers({
    Authorization: "Bearer " + verifytoken
  })
}).then((response) => {
  return response.json();
}).then((data) => {
  console.log(data);
  const itinerary = document.getElementById("itinerary");
  const driver = document.getElementById("driver");
  console.log(document);
  for (const i in data) {
    itinerary.innerHTML +=
    `<h4>路線ID：${data[i].id}</h4>
    <h4>起點：${data[i].origin}</h4>
    <h4>終點：${data[i].destination}</h4>
    <h5>日期：${data[i].date}</h5>
    <h5>時間：${data[i].time}</h5>
    <h5>人數：${data[i].persons}</h5>
    <h5>費用：${data[i].fee}</h5>`;
    driver.innerHTML +=
    `<h3>車主資訊</h3><div><img src="../uploads/images/member.png"></div>
    <div>${data[0].name}</div>
    <button id="contact" type="button" onclick="contact()">聯繫車主</button>`;
  }
});

window.onload = function () {
  const homePage = document.getElementById("homePage");
  homePage.addEventListener("click", () => {
    document.location.href = "./";
  });
};
