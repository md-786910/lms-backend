const { Model } = require("sequelize");
const { TABLE_NAME, TABLE_MODEL_MAPPING } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class Company extends Model {}
  Company.init(
    {
      company_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      company_size: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      logo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      industry: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      company_website: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      country_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      subscribe_newsletter: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      terms_accepted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.COMPANY],
      tableName: TABLE_NAME.COMPANY,
      timestamps: true,
    }
  );
  return Company;
};
