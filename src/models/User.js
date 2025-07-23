// models/User.js
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Each User belongs to one Company
      User.belongsTo(models.Company, {
        foreignKey: "company_id",
        as: "company",
        onDelete: "SET NULL",
      });
    }
  }
  User.init(
    {
      first_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone_country_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      job_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      is_verified_email: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      role: {
        type: DataTypes.ENUM,
        values: ["admin", "superadmin"],
        defaultValue: "admin",
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
