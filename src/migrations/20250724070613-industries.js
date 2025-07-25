"use strict";

const { TABLE_NAME } = require("../constants/table");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(TABLE_NAME.INDUSTY, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(TABLE_NAME.INDUSTY);
  },
};
