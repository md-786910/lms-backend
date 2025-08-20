const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class EmployeeSalary extends Model {}
  EmployeeSalary.init(
    {
      base_salary: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      bonus: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      cca: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      hra: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      is_epf_applicable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      epf: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      epf_pension: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      epf_admin: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      total_allowance: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      salary_with_allowance: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      total_deduction_allowance: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      payable_salary: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      bank_account_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ifsc_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bank_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      upi_number: {
        type: DataTypes.STRING,
      },
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      effective_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE_SALARY],
      tableName: TABLE_NAME.EMPLOYEE_SALARY,
      timestamps: true,
    }
  );
  return EmployeeSalary;
};
