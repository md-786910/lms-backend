"use strict";

const { TABLE_NAME } = require("../constants/table");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(TABLE_NAME.EXTRA_WORK_LEAVE_TRANSACTION, {
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
      transaction_type: {
        type: Sequelize.ENUM("credit", "debit"),
        allowNull: false,
      },
      source_type: {
        type: Sequelize.ENUM("proof_of_work", "leave_request", "adjustment"),
        allowNull: false,
      },
      source_id: {
        type: Sequelize.INTEGER,
      },
      days: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      balance_after: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      description: {
        type: Sequelize.TEXT,
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
      TABLE_NAME.EXTRA_WORK_LEAVE_TRANSACTION,
      ["company_id", "employee_id", "createdAt"],
      { name: "extra_work_leave_transactions_employee_timeline" }
    );
    await queryInterface.addIndex(
      TABLE_NAME.EXTRA_WORK_LEAVE_TRANSACTION,
      ["transaction_type", "source_type", "source_id"],
      {
        name: "extra_work_leave_transactions_source_unique",
        unique: true,
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable(TABLE_NAME.EXTRA_WORK_LEAVE_TRANSACTION);
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_extra_work_leave_transactions_transaction_type";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_extra_work_leave_transactions_source_type";'
    );
  },
};
