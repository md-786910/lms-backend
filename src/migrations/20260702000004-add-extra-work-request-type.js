"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TYPE "enum_leave_requests_request_type" ADD VALUE IF NOT EXISTS \'extra_work\';'
    );
  },

  async down() {
    // PostgreSQL does not support removing enum values safely without recreating the type.
  },
};
