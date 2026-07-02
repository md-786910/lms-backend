"use strict";

const { TABLE_NAME } = require("../constants/table");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(TABLE_NAME.EXTRA_WORK_LEAVE_BALANCE, {
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
      total_earned: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      total_used: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      balance: {
        type: Sequelize.FLOAT,
        allowNull: false,
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

    await queryInterface.addIndex(
      TABLE_NAME.EXTRA_WORK_LEAVE_BALANCE,
      ["company_id", "employee_id"],
      {
        name: "extra_work_leave_balances_company_employee_unique",
        unique: true,
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable(TABLE_NAME.EXTRA_WORK_LEAVE_BALANCE);
  },
};
