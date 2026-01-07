// config/config.js
module.exports = {
  development: {
    username: "postgres",
    password: "postgres",
    database: "lms1",
    host: "db",
    dialect: "postgres",
    define: {
      separate: true,
    },
    //  logging: console.log,
    logging: false,
    dialectOptions: {
      requestTimeout: 400000,
    },
  },
  test: {
    username: "postgres",
    password: "postgres",
    database: "lms",
    host: "db",
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      requestTimeout: 400000,
    },
  },
  production: {
    username: "postgres",
    password: "postgres",
    database: "lms",
    host: "db",
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      requestTimeout: 400000,
    },
  },
};
