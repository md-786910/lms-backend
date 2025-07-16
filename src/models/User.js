// models/User.js
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {}
  User.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true,
    }
  );
  return User;
};
