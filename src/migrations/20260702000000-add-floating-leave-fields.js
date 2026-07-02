"use strict";

const { TABLE_NAME } = require("../constants/table");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(TABLE_NAME.LEAVE_REQUEST, "request_type", {
      type: Sequelize.ENUM("policy", "floating"),
      allowNull: false,
      defaultValue: "policy",
    });
    await queryInterface.addColumn(TABLE_NAME.LEAVE_REQUEST, "festival_name", {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn(TABLE_NAME.LEAVE_REQUEST, "festival_date", {
      type: Sequelize.DATEONLY,
    });
    await queryInterface.addColumn(TABLE_NAME.LEAVE_REQUEST, "justification", {
      type: Sequelize.TEXT,
    });
    await queryInterface.addIndex(
      TABLE_NAME.LEAVE_REQUEST,
      ["company_id", "employee_id", "request_type", "festival_date", "status"],
      { name: "leave_requests_floating_leave_quota_lookup" }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      TABLE_NAME.LEAVE_REQUEST,
      "leave_requests_floating_leave_quota_lookup"
    );
    await queryInterface.removeColumn(TABLE_NAME.LEAVE_REQUEST, "justification");
    await queryInterface.removeColumn(TABLE_NAME.LEAVE_REQUEST, "festival_date");
    await queryInterface.removeColumn(TABLE_NAME.LEAVE_REQUEST, "festival_name");
    await queryInterface.removeColumn(TABLE_NAME.LEAVE_REQUEST, "request_type");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_leave_requests_request_type";'
    );
  },
};
