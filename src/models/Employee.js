const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");

module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {
    static associate(models) {
      this.hasOne(models[TABLE_MODEL_MAPPING[TABLE_NAME.DEPARTMENT]], {
        foreignKey: "id",
        sourceKey: "department_id",
        as: "department",
      });
      this.hasOne(models[TABLE_MODEL_MAPPING[TABLE_NAME.DESIGNATION]], {
        foreignKey: "id",
        sourceKey: "designation_id",
        as: "designation",
      });
      this.hasMany(models[TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE_LEAVE]], {
        sourceKey: "id",
        foreignKey: "employee_id",
        as: "employee_leaves",
      });
      this.hasOne(models[TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE_ADDRESS]], {
        foreignKey: "employee_id",
        sourceKey: "id",
        as: "address",
      });

      this.hasOne(
        models[TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE_PERSONAL_INFORMATION]],
        {
          foreignKey: "employee_id",
          sourceKey: "id",
          as: "personal_information",
        }
      );

      this.hasOne(models[TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE_SALARY]], {
        foreignKey: "employee_id",
        sourceKey: "id",
        as: "employee_salary",
      });

      this.hasMany(models[TABLE_MODEL_MAPPING[TABLE_NAME.LEAVE_REQUEST]], {
        foreignKey: "employee_id",
        sourceKey: "id",
        as: "leaveRequests",
      });
    }
  }
  Employee.init(
    {
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      employee_no: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      first_name: {
        type: DataTypes.STRING,
      },
      last_name: {
        type: DataTypes.STRING,
      },
      full_name: {
        type: DataTypes.VIRTUAL,
        get() {
          return `${this.first_name} ${this.last_name}`;
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
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
      date_of_birth: {
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
      is_email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_password_created: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      profile: {
        type: DataTypes.STRING,
      },
      role: {
        type: DataTypes.ENUM,
        values: ["employee"],
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
