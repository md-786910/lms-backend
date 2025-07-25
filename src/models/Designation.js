// models/Designation.js
const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class Designation extends Model {
    static associate(models) {
      this.hasOne(models[TABLE_MODEL_MAPPING[TABLE_NAME.DEPARTMENT]], {
        foreignKey: "id",
        sourceKey: "department_id",
        as: "department",
      });
    }
  }
  Designation.init(
    {
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.DESIGNATION],
      tableName: TABLE_NAME.DESIGNATION,
      timestamps: true,
    }
  );
  return Designation;
};
