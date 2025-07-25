const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class UserSession extends Model {}
  UserSession.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.USER_SESSION],
      tableName: TABLE_NAME.USER_SESSION,
      timestamps: true,
    }
  );
  return UserSession;
};
