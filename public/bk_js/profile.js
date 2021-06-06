const verifyToken = localStorage.getItem("access_token");
fetch("api/1.0/profile", {
  method: "GET",
  header: new Headers({
    Authorization: "Bearer " + verifyToken
  })
}).then((response) => {
  response.json();
}).then((data) => {

}).catch((error) => {
  console.error("Error:", error);
});
