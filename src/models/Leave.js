// models/Leave.js
const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class Leave extends Model {
    static associate(models) {}
  }
  Leave.init(
    {
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      annual_days: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      monthlyAccrual: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      resetCycleMonths: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 6,
      },
      carryForwardEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      salaryDeductionEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      status: {
        type: DataTypes.ENUM,
        values: ["active", "inactive"],
        allowNull: false,
        defaultValue: "active",
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.LEAVE],
      tableName: TABLE_NAME.LEAVE,
      timestamps: true,
    }
  );
  return Leave;
};
