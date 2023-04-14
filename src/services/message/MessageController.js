const {MessageService} = require("./MessageService");
const {verifyToken} = require("../../middlewares/jwtAuth");
const router = require('express').Router();

router.patch('/seen',verifyToken, async (req, res, next) => {
  // #swagger.tags = ['Message']

  try {
    const {conversationId, messageIds} = req.body;
    const {userId} = req;
    const currentUnseen = await MessageService.seenMessages(userId, conversationId, messageIds);
    const totalUnseen = await MessageService.countUnseenMessages(userId);

    res.status(200).json({data: {totalUnseen, currentUnseen}})
  } catch (e) {
    next(e)
  }
})

module.exports = {MessageController: router}
