const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class EmployeeDocument extends Model {}
  EmployeeDocument.init(
    {
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      document_category_id: {
        type: DataTypes.INTEGER,
      },
      document_number: {
        type: DataTypes.STRING,
      },
      file_path: {
        type: DataTypes.STRING,
      },
      street: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE_DOCUMENT],
      tableName: TABLE_NAME.EMPLOYEE_DOCUMENT,
      timestamps: true,
    }
  );
  return EmployeeDocument;
};
