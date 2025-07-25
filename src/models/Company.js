const { Model } = require("sequelize");
const { TABLE_NAME, TABLE_MODEL_MAPPING } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class Company extends Model {
    static associate(models) {
      // A Company has many Users
      this.hasOne(models[TABLE_MODEL_MAPPING[TABLE_NAME.COUNTRY]], {
        foreignKey: "id",
        sourceKey: "country_id",
        as: "country",
      });
      this.hasOne(models[TABLE_MODEL_MAPPING[TABLE_NAME.INDUSTY]], {
        foreignKey: "id",
        sourceKey: "industry_id",
        as: "industry",
      });
      // Company.hasMany(models.User, {
      //   foreignKey: "company_id",
      //   as: "users",
      //   onDelete: "CASCADE",
      // });
      // Company.hasMany(models.EmployeePersonalInformation, {
      //   foreignKey: "company_id",
      //   as: "employee_personal_infos",
      // });
    }
  }
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
      industry_id: {
        type: DataTypes.INTEGER,
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
      tax_no: {
        type: DataTypes.STRING,
      },
      address: {
        type: DataTypes.TEXT,
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
