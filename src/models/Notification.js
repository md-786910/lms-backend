// models/Leave.js
const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {}
  }
  Notification.init(
    {
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
      },
      message: {
        type: DataTypes.STRING,
      },
      read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.NOTIFICATION],
      tableName: TABLE_NAME.NOTIFICATION,
      timestamps: true,
    }
  );
  return Notification;
};
