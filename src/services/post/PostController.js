const {Router} = require("express");
const {PostService} = require("./PostService");
const {verifyToken} = require("../../middlewares/jwtAuth");
const {uploadPostPhoto} = require("../../config/uploadFile");
const router = Router();

router.post('/' , verifyToken, uploadPostPhoto.array('photoFiles') ,async (req, res, next) => {
  // #swagger.tags = ['Post']

  try {
    const postData = req.body;
    const photoFiles = req.files;
    const {userId} = req;
    const post = await PostService.create(userId,postData, photoFiles);
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
    const totalReaction = await PostService.updateReact(userId, media, id, react);
    res.status(200).json({
      data: {
        success: true,
        totalReaction,
        reaction: react
    }});
  } catch (e) {
    next(e)
  }
})

router.patch('/un-reaction', verifyToken, async (req, res, next) => {
  // #swagger.tags = ['Post']

  try {
    const {userId} = req;
    const {mediaId, mediaType} = req.body;
    const totalReaction = await PostService.unReact(userId, mediaId, mediaType);
    res.status(200).json({
      data: {
        message: 'update success',
        totalReaction,
        reaction: null
      }
    })
  } catch (e) {
    next(e)
  }
});

router.post('/comment', verifyToken, async (req, res, next) => {
  // #swagger.tags = ['Post']

  try {
    const {content, mediaId, mediaType} = req.body;
    const {userId} = req;
    await PostService.comment(userId, content, mediaId, mediaType);
    res.status(201).json({data: {message: 'comment success'}});
  } catch (e) {
    next(e)
  }
});

router.get('/:id/comments', async (req, res, next) => {
  // #swagger.tags = ['Post']

  try {
    const {id} = req.params;
    const comments = await PostService.getComments(id);
    res.status(200).json({data: comments});
  } catch (e) {
    next(e)
  }
})
module.exports = {PostController: router};