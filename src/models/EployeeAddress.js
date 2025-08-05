const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class EmployeeAddress extends Model {
    static associate(models) {
      this.hasOne(models[TABLE_MODEL_MAPPING[TABLE_NAME.COUNTRY]], {
        foreignKey: "id",
        sourceKey: "country_id",
        as: "country",
      });
    }
  }
  EmployeeAddress.init(
    {
      street: {
        type: DataTypes.STRING,
      },
      city: {
        type: DataTypes.STRING,
      },
      state: {
        type: DataTypes.STRING,
      },
      zip_code: {
        type: DataTypes.STRING,
      },
      permanent_address: {
        type: DataTypes.TEXT,
        defaultValue: false,
      },
      country_id: {
        type: DataTypes.INTEGER,
      },
      employee_id: {
        type: DataTypes.INTEGER,
      },
      company_id: {
        type: DataTypes.INTEGER,
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE_ADDRESS],
      tableName: TABLE_NAME.EMPLOYEE_ADDRESS,
      timestamps: true,
    }
  );
  return EmployeeAddress;
};
