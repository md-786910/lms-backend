// models/Template.js
const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class Template extends Model {
    static associate(models) {}
  }
  Template.init(
    {
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
      },
      subject: {
        type: DataTypes.STRING,
      },
      content: {
        type: DataTypes.TEXT,
      },
      type: {
        type: DataTypes.INTEGER,
      },
      employee_variables: {
        type: DataTypes.JSONB,
      },
      company_variables: {
        type: DataTypes.JSONB,
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.TEMPLATE],
      tableName: TABLE_NAME.TEMPLATE,
      timestamps: true,
    }
  );
  return Template;
};
