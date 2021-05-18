const express = require("express");
const app = express();
const util = require("./util/util");
const bodyParser = require("body-parser");
const API_VERSION = process.env;
const pathRoutes = require("./server/routes/path_routes");
const userRoutes = require("./server/routes/user_routes");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extend: true }));
app.use("/api/1.0", express.static("public"));
app.use(pathRoutes);
app.use(userRoutes);

// app.use("/api/" + API_VERSION, [pathRoutes]);

app.get("/test", async (req, res) => {
  // const distance = await util.calculateDistance([121.831112, 24.518504], [121.58174, 25.044311]);
  // console.log(distance);
  // eslint-disable-next-line max-len
  const place = { passenger1: { route: [[121.831112, 24.518504], [121.58174, 25.044311]] }, passenger2: { route: [[121.748611, 24.748217], [121.747473, 24.467832]] }, passenger3: { route: [[121.800613, 24.463778], [121.613073, 23.982576]] } };
  const direction = await util.getDirection("台北車站", "花蓮");
  const onRoadPassenger = [];
  const onRoadLocation = {};
  for (const i in place) {
    for (const j in direction) {
      const distance = util.getDistanceFromLatLonInKm(direction[j], place[i].route[0]);
      if (distance <= 5) {
        if (!onRoadLocation[i]) {
          onRoadLocation[i] = place[i].route;
          console.log("onRoadLocation", onRoadLocation);
        }
      }
    }
  }
  onRoadPassenger.push(onRoadLocation);
  res.send(onRoadPassenger);
});

app.get("/get-lon-lat", async (req, res) => {
  const result = await util.transferToLatLng();
  console.log(result);
  res.send(result);
});

app.get("/choose-mvp", (req, res) => {
  const passengerSortByDistance = util.sortAllPassengerByDistance();
  console.log(passengerSortByDistance);
  res.send({ passengerSortByDistance });
});

// app.post("/api/1.0/request-seats-info", (req, res) => {
//   const data = req.body;
//   console.log("req.body", req.body);
//   console.log("Bdata:", data);
// });

app.listen(3000, () => {
  console.log("Server Started...");
});
