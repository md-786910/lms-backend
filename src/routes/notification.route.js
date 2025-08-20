const express = require("express");
const { emitToUser } = require("../config/initsocket");
const { STATUS_CODE } = require("../constants/statusCode");
const { notificationRepos } = require("../repository/base");
const { not } = require("joi");
const { ROLE } = require("../constants/user");

const notificationRouter = express.Router();

// fire notification
notificationRouter.route("/").get((req, res) => {
  const { userId } = req.query;
  const payload = {
    message: "This is a test notification",
  };
  emitToUser(userId, "notify:user", payload, {
    message: payload.message,
  });
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Notification sent",
  });
});

// get all notifications for a user
notificationRouter.get("/admin", async (req, res) => {
  const { company_id } = req.user;
  const notifications = await notificationRepos.findAll({
    where: { company_id, role: [ROLE.ADMIN, ROLE.LIGHT_ADMIN] },
    order: [["createdAt", "DESC"]],
  });
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "All notifications fetched",
    data: notifications,
  });
});

notificationRouter.get("/employee", async (req, res) => {
  const { company_id, id } = req.user;
  const notifications = await notificationRepos.findAll({
    where: { company_id, user_id: id, role: ROLE.EMPLOYEE },
    order: [["createdAt", "DESC"]],
  });
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "All notifications fetched",
    data: notifications,
  });
});

// read
notificationRouter.get("/read/:id", async (req, res) => {
  const { id } = req.params;
  if (!id || id === "undefined") {
    return res.status(STATUS_CODE.BAD_REQUEST).json({
      status: false,
      message: "Notification id is required",
    });
  }
  const { company_id } = req.user;
  await notificationRepos.update(
    {
      read: true,
    },
    {
      where: {
        id,
        company_id,
      },
    }
  );
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "All notifications fetched",
    data: null,
  });
});
module.exports = notificationRouter;
