const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class ProofOfWorkSubmission extends Model {
    static associate(models) {
      this.hasMany(models[TABLE_MODEL_MAPPING[TABLE_NAME.PROOF_OF_WORK_ATTACHMENT]], {
        sourceKey: "id",
        foreignKey: "proof_of_work_id",
        as: "attachments",
      });

      this.hasOne(models[TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE]], {
        sourceKey: "employee_id",
        foreignKey: "id",
        as: "employee",
      });

      this.hasOne(models[TABLE_MODEL_MAPPING[TABLE_NAME.USER]], {
        sourceKey: "reviewed_by",
        foreignKey: "id",
        as: "reviewer",
      });
    }
  }

  ProofOfWorkSubmission.init(
    {
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      work_type: {
        type: DataTypes.ENUM,
        values: ["remote", "overtime", "special_assignment", "task_completion"],
        allowNull: false,
      },
      work_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM,
        values: ["pending", "approved", "rejected"],
        defaultValue: "pending",
      },
      manager_comment: {
        type: DataTypes.TEXT,
      },
      reviewed_by: {
        type: DataTypes.INTEGER,
      },
      reviewed_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.PROOF_OF_WORK_SUBMISSION],
      tableName: TABLE_NAME.PROOF_OF_WORK_SUBMISSION,
      timestamps: true,
    }
  );

  return ProofOfWorkSubmission;
};
