const {verifyToken} = require("../../middlewares/jwtAuth");
const {NotificationService} = require("./NotificationService");
const router = require('express').Router();

router.get('/', verifyToken, async (req, res, next) => {
  // #swagger.tags = ['Notifications']

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

router.patch('/seen',verifyToken, async (req, res, next) => {
  // #swagger.tags = ['Notifications']
  try {
    const {notificationIds} = req.body;
    const {userId} = req;
    await NotificationService.updateSeen(userId, notificationIds);
    const unseenNotifications = await NotificationService.countUnseenNotification(userId);

    res.status(200).json({message: 'success', data: {unseen: unseenNotifications}});
  } catch (e) {
    next(e)
  }
})


module.exports = {NotificationController: router};