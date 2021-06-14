
fetch("api/1.0/user-profile", {
  method: "GET",
  headers: new Headers({
    Authorization: "Bearer " + verifyToken
  })
}).then((response) => {
  return response.json();
}).then((data) => {
  console.log(data);
}).catch((error) => {
  console.error("Error:", error);
});
