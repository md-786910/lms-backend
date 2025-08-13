// models/Prefix.js
const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");
const dayjs = require("dayjs");
const { convertToDate } = require("../config/appConfig");
const Pdf = require("../config/Pdf");

module.exports = (sequelize, DataTypes) => {
  class SalaryHistory extends Model {
    static associate(models) {
      this.hasOne(models[TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE]], {
        foreignKey: "id",
        sourceKey: "employee_id",
        as: "employee",
      });
    }

    // generate pdf
    static async generatePDF(data) {
      const { employee_id, company_id } = data;
      const pay_period = dayjs().format("MMMM YYYY");
      const pay_date = convertToDate(new Date());
      const current_month = dayjs().month() + 1;
      const month_name = dayjs().format("MMMM");
      const month_days = dayjs().daysInMonth();
      try {
        const {
          Company,
          Employee,
          Designation,
          EmployeePersonalInformation,
          SalaryHistory,
          EmployeeSalary,
        } = sequelize.models;
        const company = await Company.findByPk(company_id, {
          attributes: ["company_name", "address"],
        });

        // employee

        // <%= pay_period %>

        const employee = await Employee.findOne({
          attributes: ["first_name", "last_name", "date_of_joining"],
          where: {
            company_id,
            id: employee_id,
          },
          include: [
            {
              attributes: ["title"],
              model: Designation,
              as: "designation",
            },
            {
              attributes: ["esic_no", "epf_no"],
              model: EmployeePersonalInformation,
              as: "personal_information",
            },
            {
              attributes: [
                "hra",
                "cca",
                "bonus",
                "is_epf_applicable",
                "epf",
                "epf_pension",
                "epf_admin",
                "salary_with_allowance",
                "total_allowance",
              ],
              model: EmployeeSalary,
              as: "employee_salary",
            },
          ],
        });
        const salary = await SalaryHistory.findOne({
          attributes: ["base_salary", "deduction", "net_salary", "salary"],
          where: {
            company_id,
            employee_id,
            month_in_digit: current_month,
          },
        });

        const result = {
          company,
          employee,
          pay_period,
          pay_date,
          salary,
          month_name: month_name.toLocaleUpperCase(),
          year: dayjs().year(),
          month_days,
          total_leave: 0,
        };
        // generate pdf
        const folder = `document/${employee_id}/${current_month}/`;
        const name = "salary_slip.pdf";
        const pdf = await Pdf.create("pdf.ejs", result, folder, name);
        if (!pdf) {
          return false;
        }
        return folder + name;
      } catch (error) {
        console.log({ error });
        return false;
      }
    }
  }
  SalaryHistory.init(
    {
      company_id: {
        type: DataTypes.INTEGER,
      },
      employee_id: {
        type: DataTypes.INTEGER,
      },
      salary: {
        type: DataTypes.JSONB,
      },
      base_salary: {
        type: DataTypes.FLOAT,
      },
      bonus: {
        type: DataTypes.FLOAT,
      },
      total_allowance: {
        type: DataTypes.FLOAT,
      },
      deduction: {
        type: DataTypes.FLOAT,
      },
      net_salary: {
        type: DataTypes.FLOAT,
      },
      status: {
        type: DataTypes.ENUM,
        values: ["pending", "paid"],
        defaultValue: "pending",
      },
      is_paid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      month: {
        type: DataTypes.STRING,
      },
      month_in_digit: {
        type: DataTypes.INTEGER,
      },
      salary_slip: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: TABLE_MODEL_MAPPING[TABLE_NAME.SALARY_HISTORY],
      tableName: TABLE_NAME.SALARY_HISTORY,
      timestamps: true,
    }
  );
  return SalaryHistory;
};
