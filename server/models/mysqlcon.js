require("dotenv").config();
const mysql = require("mysql");
const { NODE_ENV, DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE, DB_DATABASE_TEST } = process.env;
const { promisify } = require("util");
const env = NODE_ENV || "production";

const mysqlConfig = {
  production: {
    connectionLimit: 20,
    waitForConnections: true,
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE
  },
  development: {
    connectionLimit: 30,
    waitForConnections: true,
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE
  },
  test: {
    connectionLimit: 20,
    waitForConnections: true,
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE_TEST
  }
};

const mysqlPool = mysql.createPool(mysqlConfig[env]);

mysqlPool.getConnection((err, connection) => {
  if (err) {
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.error("Database connection was closed.");
    }
    if (err.code === "ER_CON_COUNT_ERROR") {
      console.error("Database has too many connections.");
    }
    if (err.code === "ECONNREFUSED") {
      console.error("Databasae connection was refused.");
    }
  }

  if (connection) {
    console.log("MySQL server is ready!");
    connection.release();
  }
});

const promiseQuery = promisify(mysqlPool.query).bind(mysqlPool);
const promiseEnd = promisify(mysqlPool.end).bind(mysqlPool);

const promiseConnection = () => {
  return new Promise((resolve, reject) => {
    mysqlPool.getConnection((err, connection) => {
      if (err) reject(err);
      console.log("MySQL pool connected: threadId " + connection.threadId);
      const query = (sql, binding) => {
        return new Promise((resolve, reject) => {
          connection.query(sql, binding, (err, result) => {
            if (err) reject(err);
            resolve(result);
          });
        });
      };
      const release = () => {
        return new Promise((resolve, reject) => {
          if (err)reject(err);
          resolve(connection.release());
        });
      };
      resolve({ query, release });
    });
  });
};

module.exports = {
  query: promiseQuery,
  end: promiseEnd,
  connection: promiseConnection
};
