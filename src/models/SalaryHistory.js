// models/Prefix.js
const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class SalaryHistory extends Model {
    static associate(models) {}
  }
  SalaryHistory.init(
    {
      company_id: {
        type: DataTypes.INTEGER,
      },
      employee_id: {
        type: DataTypes.INTEGER,
      },
      salary: {
        type: DataTypes.JSONB,
      },
      base_salary: {
        type: DataTypes.FLOAT,
      },
      bonus: {
        type: DataTypes.FLOAT,
      },
      deduction: {
        type: DataTypes.FLOAT,
      },
      net_salary: {
        type: DataTypes.FLOAT,
      },
      status: {
        type: DataTypes.ENUM,
        values: ["pending", "paid"],
        defaultValue: "pending",
      },
      is_paid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.SALARY_HISTORY],
      tableName: TABLE_NAME.SALARY_HISTORY,
      timestamps: true,
    }
  );
  return SalaryHistory;
};
