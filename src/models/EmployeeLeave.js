const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class EmployeeLeave extends Model {
    static associate(models) {}
  }
  EmployeeLeave.init(
    {
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      leave_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      leave_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      leave_remaing: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      leave_used: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      leave_type: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE_LEAVE],
      tableName: TABLE_NAME.EMPLOYEE_LEAVE,
      timestamps: true,
    }
  );
  return EmployeeLeave;
};
