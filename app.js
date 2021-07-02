require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const { API_VERSION, NODE_ENV, PORT_TEST, PORT } = process.env;
const port = NODE_ENV == "test" ? PORT_TEST : PORT;
const { query } = require("./server/models/mysqlcon");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extend: true }));
app.use(express.static("public"));

// socket.io
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const { socketCon } = require("./server/controllers/socket_controller");
socketCon(io);

// api route
app.use("/api/" + API_VERSION,
  [
    require("./server/routes/user_route"),
    require("./server/routes/path_route"),
    require("./server/routes/passenger_route"),
    require("./server/routes/chat_route")
  ]
);

app.get("/delete", async (req, res) => {
  for (let i = 3457; i < 3487; i++) {
    const deletee = await query(`DELETE FROM routes_waypoints WHERE id = ${i};`);
    console.log(deletee);
  }
});

// Page not found
app.use(function (req, res, next) {
  res.status(404).sendFile(path.join(__dirname, "/public/404.html"));
});

// Error handling
app.use(function (err, req, res, next) {
  console.log(err);
  res.status(500).send("Internal Server Error");
});

if (NODE_ENV != "production") {
  server.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
  });
}

module.exports = server;
