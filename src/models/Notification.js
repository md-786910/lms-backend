// models/Leave.js
const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");
const { emitToUser } = require("../config/initsocket");

const genUserId = (role, id) => {
  if (role === "employee") {
    return `employee_${id}`;
  } else if (role === "admin") {
    return `admin_${id}`;
  } else if (role === "light_admin") {
    return `light_admin_${id}`;
  }
};

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {}

    static async notifyUser({
      user_id,
      company_id,
      title,
      message,
      role = "admin",
    }) {
      const notification = await this.create({
        user_id,
        company_id,
        title,
        message,
        read: false,
        role,
      });
      // Emit the notification to the user via socket
      const payload = {
        title,
        message,
      };
      const newUserId = genUserId(role, user_id);
      await emitToUser(newUserId, "notify:user", payload, {
        message: payload.message,
      });
      return notification;
    }
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
      role: {
        type: DataTypes.STRING,
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
