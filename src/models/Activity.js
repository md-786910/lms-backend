// models/Currency.js
const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");
const { activityRepos } = require("../repository/base");

module.exports = (sequelize, DataTypes) => {
  class Activity extends Model {
    static associate(models) {}

    static async addActivity(data) {
      try {
        const { company_id, employee_id, title, message = "" } = data;
        await sequelize.models.Activity.create({
          company_id,
          employee_id,
          title,
          message,
        });
        return true;
      } catch (error) {
        throw error;
      }
    }
  }

  Activity.init(
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
      },
      message: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.ACTIVITY],
      tableName: TABLE_NAME.ACTIVITY,
      timestamps: true,
    }
  );
  return Activity;
};
