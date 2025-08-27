// models/Prefix.js
const { Model } = require("sequelize");
const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");
const dayjs = require("dayjs");
const {
  convertToDate,
  formatPrice,
  numberToWords,
} = require("../config/appConfig");
const Pdf = require("../config/Pdf");
const year = dayjs().year();
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
          LeaveRequest,
          Notification,
          Activity,
        } = sequelize.models;
        const company = await Company.findByPk(company_id, {
          attributes: ["company_name", "address"],
          raw: true,
        });

        // employee leave lequest
        const leave_count = await LeaveRequest.findAll({
          attributes: ["total_days"],
          where: {
            employee_id,
            company_id,
            status: "approved",
          },
        });

        let total_leave = 0;
        for (const leave of leave_count) {
          total_leave += parseFloat(leave?.total_days || 0);
        }
        total_leave = total_leave.toFixed(1);

        // <%= pay_period %>

        let employee = await Employee.findOne({
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
        employee = JSON.parse(JSON.stringify(employee));
        const hraYTD = formatPrice(
          current_month * parseFloat(employee.employee_salary.hra || 0)
        );
        // employee salary
        let total_epf =
          (employee.employee_salary?.epf_admin || 0) +
          (employee.employee_salary?.epf_pension || 0);

        employee.employee_salary.salary_with_allowance = formatPrice(
          parseFloat(employee.employee_salary.salary_with_allowance) || 0
        );
        employee.employee_salary.total_allowance = formatPrice(
          parseFloat(employee.employee_salary.total_allowance) || 0
        );
        employee.employee_salary.hra = formatPrice(
          parseFloat(employee.employee_salary.hra) || 0
        );
        employee.employee_salary.bonus = formatPrice(
          parseFloat(employee.employee_salary.bonus) || 0
        );
        employee.employee_salary.cca = formatPrice(
          parseFloat(employee.employee_salary.cca) || 0
        );
        employee.employee_salary.epf_pension = formatPrice(
          parseFloat(employee.employee_salary.epf_pension) || 0
        );
        employee.employee_salary.epf_admin = formatPrice(
          parseFloat(employee.employee_salary.epf_admin) || 0
        );

        let salary = await SalaryHistory.findOne({
          attributes: ["base_salary", "deduction", "net_salary", "salary"],
          where: {
            company_id,
            employee_id,
            month_in_digit: current_month,
          },
        });
        salary = JSON.parse(JSON.stringify(salary));
        const basicYTD = formatPrice(
          current_month * parseFloat(salary.base_salary || 0)
        );
        const amount_in_inr = numberToWords(salary?.net_salary);

        const epfYTD = formatPrice(current_month * total_epf);

        // salary
        salary.base_salary = formatPrice(salary.base_salary);
        salary.deduction = formatPrice(salary.deduction);
        salary.net_salary = formatPrice(salary.net_salary);
        salary.salary = formatPrice(salary.salary);
        console.log({ amount_in_inr });
        const result = {
          company,
          employee,
          pay_period,
          pay_date,
          salary,
          month_name: month_name.toLocaleUpperCase(),
          year: dayjs().year(),
          month_days,
          total_epf: formatPrice(total_epf),
          amount_in_inr,
          basicYTD,
          hraYTD,
          epfYTD,
          total_leave,
        };
        // generate pdf
        const folder = `document/${year}/${employee_id}/${current_month}/`;
        const name = "salary_slip.pdf";
        const pdf = await Pdf.create("pdf.ejs", result, folder, name);
        console.log({ pdf });
        if (!pdf) {
          return false;
        }

        // fire notification
        await Notification.notifyUser({
          user_id: employee_id,
          company_id,
          title:
            "Your salary slip has been generated for the month of " +
            month_name,
          message:
            "Your salary slip has been generated for the month of " +
            month_name,
          role: "employee",
        });

        await Activity.addActivity({
          company_id,
          employee_id,
          title:
            "Salary slip has been generated for the month of " + month_name,
          message:
            "Salary slip has been generated for the month of " + month_name,
          role: "employee",
        });

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
      year: {
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
