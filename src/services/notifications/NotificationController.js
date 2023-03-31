const {verifyToken} = require("../../middlewares/jwtAuth");
const {NotificationService} = require("./NotificationService");
const router = require('express').Router();

router.get('/', verifyToken, async (req, res, next) => {
  try {
    const {page = 0, offset = 0} = req.query;
    const {userId} = req;
    const notifications = await NotificationService.getNotifications(userId, Number(page), offset);
    res.status(200).json({
      data: notifications
    })
  } catch (e) {
    next(e);
  }
})

router.patch('/seen', async (req, res, next) => {
  // #swagger.tags = ['']
  try {
    const notificationIds = req.body;
    await NotificationService.updateSeen(notificationIds);
    res.status(200).json({message: 'success'});
  } catch (e) {
    next(e)
  }
})


module.exports = {NotificationController: router};