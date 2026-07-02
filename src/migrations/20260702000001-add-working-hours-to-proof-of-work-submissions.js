"use strict";

const { TABLE_NAME } = require("../constants/table");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(TABLE_NAME.PROOF_OF_WORK_SUBMISSION, "working_hours", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "full_day",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn(TABLE_NAME.PROOF_OF_WORK_SUBMISSION, "working_hours");
  },
};
