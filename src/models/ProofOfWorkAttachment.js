const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class ProofOfWorkAttachment extends Model {
    static associate(models) {
      this.hasOne(models.file, {
        sourceKey: "file_id",
        foreignKey: "id",
        as: "file",
      });

      this.hasOne(models[TABLE_MODEL_MAPPING[TABLE_NAME.PROOF_OF_WORK_SUBMISSION]], {
        sourceKey: "proof_of_work_id",
        foreignKey: "id",
        as: "submission",
      });
    }
  }

  ProofOfWorkAttachment.init(
    {
      proof_of_work_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      file_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      attachment_type: {
        type: DataTypes.STRING,
        defaultValue: "evidence",
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.PROOF_OF_WORK_ATTACHMENT],
      tableName: TABLE_NAME.PROOF_OF_WORK_ATTACHMENT,
      timestamps: true,
    }
  );

  return ProofOfWorkAttachment;
};
