"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("leaves", "monthlyAccrual", {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.addColumn("leaves", "resetCycleMonths", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 6,
    });
    await queryInterface.addColumn("leaves", "carryForwardEnabled", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn("leaves", "salaryDeductionEnabled", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn("leaves", "status", {
      type: Sequelize.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("leaves", "status");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_leaves_status";');
    await queryInterface.removeColumn("leaves", "salaryDeductionEnabled");
    await queryInterface.removeColumn("leaves", "carryForwardEnabled");
    await queryInterface.removeColumn("leaves", "resetCycleMonths");
    await queryInterface.removeColumn("leaves", "monthlyAccrual");
  },
};
