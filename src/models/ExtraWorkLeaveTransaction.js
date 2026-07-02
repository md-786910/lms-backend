const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class ExtraWorkLeaveTransaction extends Model {
    static associate(models) {
      this.hasOne(models[TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE]], {
        sourceKey: "employee_id",
        foreignKey: "id",
        as: "employee",
      });
    }
  }

  ExtraWorkLeaveTransaction.init(
    {
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      transaction_type: {
        type: DataTypes.ENUM,
        values: ["credit", "debit"],
        allowNull: false,
      },
      source_type: {
        type: DataTypes.ENUM,
        values: ["proof_of_work", "leave_request", "adjustment"],
        allowNull: false,
      },
      source_id: {
        type: DataTypes.INTEGER,
      },
      days: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      balance_after: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      description: {
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.EXTRA_WORK_LEAVE_TRANSACTION],
      tableName: TABLE_NAME.EXTRA_WORK_LEAVE_TRANSACTION,
      timestamps: true,
    }
  );

  return ExtraWorkLeaveTransaction;
};
