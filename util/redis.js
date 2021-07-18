require("dotenv").config();
const { EXPIREDAY } = process.env;
const { promisify } = require("util");
const redis = require("redis");
const redisClient = redis.createClient({ host: "localhost", port: 6379 });

redisClient.on("ready", function () {
  console.log("Redis is ready");
});

redisClient.on("error", function (error) {
  console.error(error);
});

const get = promisify(redisClient.get).bind(redisClient);
const set = promisify(redisClient.set).bind(redisClient);
const del = promisify(redisClient.del).bind(redisClient);

const getHomepageRoutes = async (key, routes) => {
  console.log(routes);
  const rawRoutesFromRedis = await get(key);
  const routesFromRedis = JSON.parse(rawRoutesFromRedis);
  for (const i in routesFromRedis) {
    if (routesFromRedis[i].id !== routes[i].id) {
      return null;
    }
  }
  console.log(routesFromRedis);
  return routesFromRedis;
};

const setHomepageRoutes = (key, routes) => {
  redisClient.set(key, JSON.stringify(routes), "EX", EXPIREDAY, err => {
    if (err) {
      console.log(err);
    } else {
      console.log("redis set successfully");
    }
  });
};

module.exports = {
  redisClient,
  getHomepageRoutes,
  setHomepageRoutes
};
