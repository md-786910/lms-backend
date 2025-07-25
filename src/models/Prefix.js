// models/Prefix.js
const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class Prefix extends Model {
    static associate(models) {
      this.hasOne(models[TABLE_MODEL_MAPPING[TABLE_NAME.DEPARTMENT]], {
        foreignKey: "id",
        sourceKey: "department_id",
        as: "department",
      });
    }
  }
  Prefix.init(
    {
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.PREFIX],
      tableName: TABLE_NAME.PREFIX,
      timestamps: true,
    }
  );
  return Prefix;
};
