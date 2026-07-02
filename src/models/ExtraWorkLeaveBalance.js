const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class ExtraWorkLeaveBalance extends Model {
    static associate(models) {
      this.hasOne(models[TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE]], {
        sourceKey: "employee_id",
        foreignKey: "id",
        as: "employee",
      });
    }
  }

  ExtraWorkLeaveBalance.init(
    {
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      total_earned: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      total_used: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      balance: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.EXTRA_WORK_LEAVE_BALANCE],
      tableName: TABLE_NAME.EXTRA_WORK_LEAVE_BALANCE,
      timestamps: true,
    }
  );

  return ExtraWorkLeaveBalance;
};
