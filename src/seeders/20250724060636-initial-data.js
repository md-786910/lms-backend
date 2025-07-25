"use strict";
const fs = require("fs");
const path = require("path");
const db = require("../models");
const { TABLE_NAME, TABLE_MODEL_MAPPING } = require("../constants/table");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const filePaths = {
      Country: {
        path: path.join(__dirname, "country.json"),
        tableName: TABLE_NAME.COUNTRY,
      },
      Industry: {
        path: path.join(__dirname, "industry.json"),
        tableName: TABLE_NAME.INDUSTY,
      },
    };

    for (const [modelName, { path: filePath, tableName }] of Object.entries(
      filePaths
    )) {
      console.log(`clearing ${modelName}...`);
      await queryInterface.bulkDelete(tableName, null, {
        truncate: true,
        cascade: true,
        restartIdentity: true,
      });
      console.log(`Importing ${filePath} into ${modelName}...`);
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      // await queryInterface.bulkInsert(modelName, data, {});
      for (const row of data) {
        await db[modelName].create(row);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
