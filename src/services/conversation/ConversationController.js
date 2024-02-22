const {Router} = require('express');
const {verifyToken} = require("../../middlewares/jwtAuth");
const {ConversationService} = require("./ConversationService");
const {utils} = require("../../utils/utils");
const router = Router();

router.get('/', verifyToken, async (req, res, next) => {
  // #swagger.tags = ['Conversation']
  try{
    const {userId} = req;
    const conversations = await ConversationService.getConversationList(userId);
    res.json({
      data: conversations
    })
  } catch (e) {
    next(e);
  }
})

router.get('/:id',verifyToken ,  async (req, res, next) => {
  // #swagger.tags = ['Conversation']

  try {
    const {userId} = req;
    const {id: conversationId} = req.params;
    let data = await ConversationService.getConversationDetail(userId, conversationId);

    res.status(200).json({data});
  } catch (e) {
    next(e);
  }
})

router.get('/:id/messages',verifyToken ,  async (req, res, next) => {
  // #swagger.tags = ['Conversation']

  try {
    const {userId} = req;
    const {id: conversationId} = req.params;
    const {offset, limit} = req.query;
    let data = await ConversationService.getMessages(userId, conversationId, offset, limit);

    res.status(200).json({data})
  } catch (e) {
    next(e);
  }

})


module.exports = {ConversationController: router}
