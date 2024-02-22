const {NewFeedService} = require("./NewFeedService");
const {verifyToken} = require("../../middlewares/jwtAuth");
router = require('express').Router();


router.get('/',verifyToken, async (req, res, next) => {
  // #swagger.tags = ['New Feed']

  try {
    const {lastId} = req.query;
    const {userId} = req;
    const pagePost = await NewFeedService.getNewFeeds(userId, lastId);
    res.status(200).json({data: pagePost})
  } catch (e) {
    next(e);
  }
})

module.exports = {NewsFeedController: router};