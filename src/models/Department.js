// models/Department.js
const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class Department extends Model {
    static associate(models) {}
  }
  Department.init(
    {
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.DEPARTMENT],
      tableName: TABLE_NAME.DEPARTMENT,
      timestamps: true,
    }
  );
  return Department;
};
