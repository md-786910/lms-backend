const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class EmployeeLeaveMonthlySummary extends Model {
    static associate(models) {}
  }

  EmployeeLeaveMonthlySummary.init(
    {
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      leave_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      leave_type: {
        type: DataTypes.STRING,
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      month: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      month_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cycle: {
        type: DataTypes.ENUM,
        values: ["first", "second"],
        allowNull: false,
      },
      monthly_entitlement: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      previous_remaining_leave: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      available_leave: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      leave_availed: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      leave_deduction: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      remaining_leave: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE_LEAVE_MONTHLY_SUMMARY],
      tableName: TABLE_NAME.EMPLOYEE_LEAVE_MONTHLY_SUMMARY,
      timestamps: true,
    }
  );

  return EmployeeLeaveMonthlySummary;
};

