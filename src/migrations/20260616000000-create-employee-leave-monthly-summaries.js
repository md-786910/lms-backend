"use strict";

const { TABLE_NAME } = require("../constants/table");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(TABLE_NAME.EMPLOYEE_LEAVE_MONTHLY_SUMMARY, {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      leave_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      leave_type: {
        type: Sequelize.STRING,
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      month_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      cycle: {
        type: Sequelize.ENUM("first", "second"),
        allowNull: false,
      },
      monthly_entitlement: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      previous_remaining_leave: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      available_leave: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      leave_availed: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      leave_deduction: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      remaining_leave: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addConstraint(TABLE_NAME.EMPLOYEE_LEAVE_MONTHLY_SUMMARY, {
      fields: ["company_id", "employee_id", "leave_id", "year", "month"],
      type: "unique",
      name: "employee_leave_monthly_summaries_unique_policy_month",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(TABLE_NAME.EMPLOYEE_LEAVE_MONTHLY_SUMMARY);
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_employee_leave_monthly_summaries_cycle";'
    );
  },
};
