"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const { ENV_VARIABLE } = require("../constants/env");
const basename = path.basename(__filename);
const env = ENV_VARIABLE.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.js")[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file.indexOf(".test.js") === -1
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// sync to true in [development] mode to create tables automatically
// sync to true in [development] mode to create tables automatically
if (env === "development") {
  sequelize
    .sync({ alter: true })
    .then(() => {
      console.log("Database synced successfully!");
    })
    .catch((err) => {
      // Handle specific constraint errors gracefully
      if (
        err.name === "SequelizeUnknownConstraintError" ||
        err.original?.code === "42704"
      ) {
        console.warn(
          "Constraint error detected. Trying to sync without altering existing constraints..."
        );
        // Try to sync without alter to avoid constraint issues
        return sequelize
          .sync({ alter: false })
          .then(() => {
            console.log(
              "Database synced successfully (without altering constraints)!"
            );
          })
          .catch((syncErr) => {
            console.error(
              "Error syncing database:",
              syncErr.message || syncErr
            );
            console.warn(
              "If this persists, you may need to manually fix the database schema or use migrations."
            );
          });
      }
      console.error("Error creating database & tables:", err);
      throw err;
    });
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
