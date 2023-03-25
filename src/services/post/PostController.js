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

router.patch('/un-react', async (req, res, next) => {
  // #swagger.tags = ['Post']

  try {
    await PostService.unReact(userId, postId);
  } catch (e) {
    next(e)
  }
})
module.exports = {PostController: router};