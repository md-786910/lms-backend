const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {}
  Employee.init(
    {
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      employee_id: {
        // prefix with EMP-01
        type: DataTypes.STRING,
        allowNull: true,
      },
      first_name: {
        type: DataTypes.STRING,
      },
      last_name: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      alternate_phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      gender: {
        type: DataTypes.ENUM,
        values: ["male", "female", "other"],
      },
      martial_status: {
        type: DataTypes.ENUM,
        values: ["single", "married", "divorced", "widowed"],
      },
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      designation_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      country_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      date_of_joining: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      last_date_of_work: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      is_suspended: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_verified_email: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      role: {
        type: DataTypes.ENUM,
        values: ["employee", "admin", "superadmin"],
        defaultValue: "employee",
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE],
      tableName: TABLE_NAME.EMPLOYEE,
      timestamps: true,
    }
  );
  return Employee;
};
