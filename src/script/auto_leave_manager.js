const { leaveRepos, employeLeaveRepos } = require("../repository/base");

async function main() {
  try {
    const leave = await leaveRepos.findAll({
      where: {
        company_id: 2,
      },
      raw: true,
    });
    // get employee leave
    let employeeLeaves = await employeLeaveRepos.findAll({
      where: {
        company_id: 2,
      },
      raw: true,
    });
    employeeLeaves = Object.groupBy(employeeLeaves, (emp) => emp.employee_id);

    for (const [employeeId, empLeaves] of Object.entries(employeeLeaves)) {
      let index = 0;
      for (const emp of empLeaves) {
        const { id, type, annual_days } = leave[index];
        // await employeLeaveRepos.update(
        //   {
        //     leave_type: type,
        //     leave_count: annual_days,
        //     leave_remaing: annual_days,
        //     leave_id: id,
        //   },
        //   {
        //     where: {
        //       id: emp.id,
        //     },
        //   }
        // );

        index++;
      }
      index = 0;
    }
  } catch (error) {
    console.log({ error });
  }
}

main().catch((err) => console.error(err));
