const {NewFeedService} = require("./NewFeedService");
const {verifyToken} = require("../../middlewares/jwtAuth");
router = require('express').Router();


router.get('/',verifyToken, async (req, res, next) => {
  // #swagger.tags = ['New Feed']

  try {
    const {page = 0} = req.query;
    const {userId} = req;
    const posts = await NewFeedService.getNewFeeds(userId, Number(page));
    res.status(200).json({data: posts})
  } catch (e) {
    next(e);
  }
})

module.exports = {NewsFeedController: router};