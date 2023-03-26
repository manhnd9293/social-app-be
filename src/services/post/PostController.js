const {Router} = require("express");
const {PostService} = require("./PostService");
const {verifyToken} = require("../../middlewares/jwtAuth");
const router = Router();

router.post('/', verifyToken ,async (req, res, next) => {
  // #swagger.tags = ['Post']

  try {
    const postData = req.body;
    const {userId} = req;
    const post = await PostService.create(userId,postData);
    res.status(201).json({data: post, message: 'create post success'});
  } catch (e) {
    next(e)
  }
})


router.get('/news-feed', verifyToken, async (req, res, next) => {
  // #swagger.tags = ['post']

  try {
    const {page} = req.query;
    const {userId} = req;
    const posts = await PostService.getNewsFeed(userId, Number(page));
    return {
      data: posts
    }
  } catch (e) {
    next(e)
  }
});

router.patch('/reaction', verifyToken, async (req, res, next) => {
  // #swagger.tags = ['Post']
  const {userId} = req;
  const {react, id, media} = req.body;
  try {
    await PostService.updateReact(userId, media, id, react);
    res.status(200).json({data: {success: true}});
  } catch (e) {
    next(e)
  }
})

router.patch('/un-reaction', verifyToken, async (req, res, next) => {
  // #swagger.tags = ['Post']

  try {
    const {userId} = req;
    const {mediaId, mediaType} = req.body;
    await PostService.unReact(userId, mediaId, mediaType);
    res.status(200).json({
      data: {
        message: 'update success'
      }
    })
  } catch (e) {
    next(e)
  }
});

router.post('/comment', verifyToken,async (req, res, next) => {
  // #swagger.tags = ['Post']

  try {
    const {content, mediaId, mediaType} = req.body;
    const {userId} = req;
    await PostService.comment(userId, content, mediaId, mediaType);
    res.status(201).json({data: {message: 'comment success'}});
  } catch (e) {
    next(e)
  }
})
module.exports = {PostController: router};