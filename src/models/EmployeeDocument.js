const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class EmployeeDocument extends Model {
    static associate(models) {
      this.hasOne(models[TABLE_MODEL_MAPPING[TABLE_NAME.DOCUMENT_CATEGORY]], {
        sourceKey: "document_category_id",
        foreignKey: "id",
        as: "document_category",
      });

      this.hasOne(models.file, {
        sourceKey: "file_id",
        foreignKey: "id",
        as: "file",
      });
    }
  }
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
      file_id: {
        type: DataTypes.INTEGER,
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
