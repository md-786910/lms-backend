const {
  employeeRepos,
  notificationRepos,
  userRepos,
} = require("../repository/base");
const eventEmitter = require("./eventEmitter");

eventEmitter.on(eventObj.LEAVE_REQUEST, async (data) => {
  try {
    console.log({ data });
    const { employee_id, company_id } = data;
    const employee = await employeeRepos.findOne({
      attributes: ["first_name", "last_name", "email"],
      where: {
        company_id,
        id: employee_id,
      },
    });
    if (!employee) {
      throw new Error("Employee not found");
    }

    // get all admin user
    const users = await userRepos.findAll({
      attributes: ["id", "email"],
      where: {
        company_id,
        role: "admin",
      },
    });
    for (const user of users) {
      // send notification to admin
      await notificationRepos.notifyUser({
        user_id: user.id,
        company_id,
        title: "leave_request",
        message: `New leave request from ${employee.first_name} ${employee.last_name}`,
      });
    }
  } catch (error) {
    throw new Error("Error processing leave request event");
  }
});
