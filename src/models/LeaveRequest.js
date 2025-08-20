// models/Leave.js
const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class LeaveRequest extends Model {
    static associate(models) {
      this.hasOne(models[TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE]], {
        sourceKey: "employee_id",
        foreignKey: "id",
        as: "employee",
      });

      this.hasOne(models[TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE_LEAVE]], {
        sourceKey: "leave_type_id",
        foreignKey: "id",
        as: "leave_type",
      });
    }
  }
  LeaveRequest.init(
    {
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      leave_type_id: {
        type: DataTypes.INTEGER,
      },
      start_date: {
        type: DataTypes.DATE,
      },
      end_date: {
        type: DataTypes.DATE,
      },
      total_days: {
        type: DataTypes.FLOAT,
      },
      leave_on: {
        type: DataTypes.JSONB,
      },
      reason: {
        type: DataTypes.TEXT,
      },
      rejected_reason: {
        type: DataTypes.TEXT,
      },
      emergency_contact_person: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.ENUM,
        values: ["pending", "approved", "rejected"],
        defaultValue: "pending",
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.LEAVE_REQUEST],
      tableName: TABLE_NAME.LEAVE_REQUEST,
      timestamps: true,
    }
  );
  return LeaveRequest;
};
