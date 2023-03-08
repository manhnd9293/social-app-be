const {Router} = require('express');
const {verifyToken} = require("../../middlewares/jwtAuth");
const {ConversationService} = require("./ConversationService");
const router = Router();

router.get('/', verifyToken, async (req, res, next) => {
  // #swagger.tags = ['User']

  try{
    const {userId} = req;
    const conversations = await ConversationService.getConversationList(userId);

    res.json({
      data: conversations
    })
  } catch (e) {
    next(e)
  }
})

module.exports = {ConversationController: router}
