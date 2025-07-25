// models/User.js
const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class Industry extends Model {
    static associate(models) {}
  }
  Industry.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.INDUSTY],
      tableName: TABLE_NAME.INDUSTY,
      timestamps: true,
    }
  );
  return Industry;
};
