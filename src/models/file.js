// models/User.js
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class File extends Model {
    static associate(models) {}
  }
  File.init(
    {
      file_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      file_path: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cloudinary_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "file",
      tableName: "files",
      timestamps: true,
    }
  );
  return File;
};
