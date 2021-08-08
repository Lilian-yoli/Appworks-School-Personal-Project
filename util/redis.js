require("dotenv").config();
const { EXPIREDAY } = process.env;
const { promisify } = require("util");
const redis = require("redis");
const redisClient = redis.createClient({ host: "localhost", port: 6379 });
const geo = require("georedis").initialize(redisClient);
const passengerLocations = geo.addSet("passengerLocations");

const schedule = require("node-schedule");

redisClient.on("ready", function () {
  console.log("Redis is ready");
});

redisClient.on("error", function (error) {
  console.error(error);
});

const get = promisify(redisClient.get).bind(redisClient);
const set = promisify(redisClient.set).bind(redisClient);
const del = promisify(redisClient.del).bind(redisClient);

const incrSet = (set, key) => {
  return new Promise((resovle, reject) => {
    set.addLocations(key, (err, reply) => {
      if (err) reject(err);
      else resovle(reply);
    });
  });
};

const removeSet = (set) => {
  return new Promise((resolve, reject) => {
    geo.deleteSet(set, (err, reply) => {
      if (err) reject(err);
      else resolve(reply);
    });
  });
};

const nearBy = async (set, coordinate, dis, options) => {
  return new Promise((resovle, reject) => {
    set.nearby(coordinate, dis, options, (err, reply) => {
      if (err) reject(err);
      else resovle(reply);
    });
  });
};

const getLocations = (set, arr) => {
  return new Promise((resolve, reject) => {
    set.locations(arr, (err, locations) => {
      if (err) reject(err);
      else resolve(locations);
    });
  });
};

// const test = async (location) => {
//   const passengerLocations = geo.addSet("passengerLocations");
//   const result = await getLocations(passengerLocations, location);
//   console.log(result);
// };

// test(["destination/4", "origin/4"]);

const getHomepageRoutes = async (key, routes) => {
  console.log("ROUTE FROM DB", routes);
  const rawRoutesFromRedis = await get(key);
  const routesFromRedis = JSON.parse(rawRoutesFromRedis);
  for (const i in routes) {
    if (!routesFromRedis || !routesFromRedis[i] || routes[i]) {
      return null;
    } else if (routesFromRedis[i] || !routes[i]) {
      return null;
    }
    if (routesFromRedis[i].id !== routes[i].id) {
      return null;
    }
  }
  console.log("routesFromRedis", routesFromRedis);
  return routesFromRedis;
};

const setHomepageRoutes = (key, routes, ex) => {
  if (!ex) {
    redisClient.set(key, JSON.stringify(routes), "EX", EXPIREDAY, err => {
      if (err) {
        console.log(err);
      } else {
        console.log("redis set successfully");
      }
    });
  } else {
    redisClient.set(key, JSON.stringify(routes), "EX", ex, err => {
      if (err) {
        console.log(err);
      } else {
        console.log("redis set successfully, expire in 10 mins");
      }
    });
  }
};

const addLocations = async (set, key) => {
  await incrSet(set, key);
};

const searchNearBy = async (set, coordinate, dis, options) => {
  console.log("coordinate", set, coordinate);
  const matchedLocation = await nearBy(set, coordinate, dis, options);
  console.log("searchNearBy", matchedLocation);
  return matchedLocation;
};

const getLocationsFromRedis = async (set, redisArr) => {
  let locationsName = await get(redisArr);
  locationsName = JSON.parse(locationsName);

  const locations = await getLocations(set, locationsName);

  const waypts = [];
  for (const i in locationsName) {
    waypts.push(locations[locationsName[i]]);
  }
  return waypts;
};

module.exports = {
  redisClient,
  getHomepageRoutes,
  setHomepageRoutes,
  addLocations,
  searchNearBy,
  removeSet,
  getLocationsFromRedis
};
