const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class EmployeePersonalInformation extends Model {}
  EmployeePersonalInformation.init(
    {
      emergency_contact_person: {
        type: DataTypes.STRING,
      },
      emergency_contact_number: {
        type: DataTypes.STRING,
      },
      emergency_contact_relationship: {
        type: DataTypes.STRING,
      },
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      blood_group: {
        type: DataTypes.STRING,
      },
      medical_conditions: {
        type: DataTypes.TEXT,
      },
      hobbies: {
        type: DataTypes.TEXT,
      },
      epf_no: {
        type: DataTypes.STRING,
      },
      esic_no: {
        type: DataTypes.STRING,
      },
      pan_no: {
        type: DataTypes.STRING,
      },
      aadhaar_no: {
        type: DataTypes.STRING,
      },
      passport_no: {
        type: DataTypes.STRING,
      },
      uan_no: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE_PERSONAL_INFORMATION],
      tableName: TABLE_NAME.EMPLOYEE_PERSONAL_INFORMATION,
      timestamps: true,
    }
  );
  return EmployeePersonalInformation;
};
