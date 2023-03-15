const {RequestService} = require("./RequestService");
const {verifyToken} = require("../../middlewares/jwtAuth");
const {UserService} = require("../user/UserService");
const router = require('express').Router();

router.post('/', async (req,res, next) => {
      // #swagger.tags = ['Request']

    try {
      const  friendRequest = req.body;
      const newRequest = await RequestService.createFriendRequest(friendRequest);

      res.json({
        data: newRequest
      })
    } catch (e) {
      next(e)
    }
})

router.patch('/state', verifyToken, async (req, res, next) => {
  // #swagger.tags = ['Request']

  try {
    const {requestId, state} = req.body;
    const {userId} = req;
    const data = await RequestService.updateFriendRequest(userId, requestId, state);

    res.status(200).json({
        message: 'update success',
        data
      }
    )
  } catch (e) {
    next(e);
  }
});

module.exports = {RequestController: router}