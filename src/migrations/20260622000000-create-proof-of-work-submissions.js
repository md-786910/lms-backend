"use strict";

const { TABLE_NAME } = require("../constants/table");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(TABLE_NAME.PROOF_OF_WORK_SUBMISSION, {
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
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      work_type: {
        type: Sequelize.ENUM("remote", "overtime", "special_assignment", "task_completion"),
        allowNull: false,
      },
      work_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },
      manager_comment: {
        type: Sequelize.TEXT,
      },
      reviewed_by: {
        type: Sequelize.INTEGER,
      },
      reviewed_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex(TABLE_NAME.PROOF_OF_WORK_SUBMISSION, [
      "company_id",
      "employee_id",
      "status",
      "work_date",
    ], {
      name: "proof_of_work_submissions_company_employee_status_date",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable(TABLE_NAME.PROOF_OF_WORK_SUBMISSION);
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_proof_of_work_submissions_work_type";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_proof_of_work_submissions_status";'
    );
  },
};
