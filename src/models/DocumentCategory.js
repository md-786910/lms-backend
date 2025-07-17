const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class DocumentCategory extends Model {}
  DocumentCategory.init(
    {
      type: {
        type: DataTypes.STRING,
      },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.DOCUMENT_CATEGORY],
      tableName: TABLE_NAME.DOCUMENT_CATEGORY,
      timestamps: true,
    }
  );
  return DocumentCategory;
};
