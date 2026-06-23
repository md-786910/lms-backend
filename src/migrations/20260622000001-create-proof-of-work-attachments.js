"use strict";

const { TABLE_NAME } = require("../constants/table");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(TABLE_NAME.PROOF_OF_WORK_ATTACHMENT, {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      proof_of_work_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      file_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      attachment_type: {
        type: Sequelize.STRING,
        defaultValue: "evidence",
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

    await queryInterface.addIndex(TABLE_NAME.PROOF_OF_WORK_ATTACHMENT, ["proof_of_work_id"], {
      name: "proof_of_work_attachments_submission_id",
    });
    await queryInterface.addIndex(TABLE_NAME.PROOF_OF_WORK_ATTACHMENT, ["file_id"], {
      name: "proof_of_work_attachments_file_id",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable(TABLE_NAME.PROOF_OF_WORK_ATTACHMENT);
  },
};
