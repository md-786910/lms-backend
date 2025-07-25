"use strict";

const { TABLE_NAME } = require("../constants/table");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("countries", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Full name of the country (e.g., "United States")',
      },
      currency_id: {
        type: Sequelize.INTEGER, // ISO 3166-1 alpha-2 code (e.g., 'US', 'IN')
      },
      code: {
        type: Sequelize.STRING, // E.g., '+1', '+91'
      },
      flag_url: {
        type: Sequelize.STRING, // E.g., '+1', '+91'
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(TABLE_NAME.COUNTRY);
  },
};
