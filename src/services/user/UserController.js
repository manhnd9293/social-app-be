const {UserService} = require("./UserService");
const {verifyToken} = require("../../middlewares/jwtAuth");
const router = require('express').Router();

router.post('/sign-in', async (req, res, next) => {
  // #swagger.tags = ['User']
  const {username, password} = req.body;
  UserService.login(username, password).then(data => {
    res.send({data})
  }).catch(e => {
    next(e);
  })
});

router.post('/sign-up', async (req, res, next) => {
  // #swagger.tags = ['User']

  const {username, password, fullName} = req.body;
  UserService.signUp(username, password, fullName).then((data) => {
    res.send({data})
  }).catch(e => {
    next(e);
  })
})

router.get('/me',verifyToken ,async (req, res) => {
  // #swagger.tags = ['User']

  const {userId} = req;
  UserService.getUser(userId, {avatar: 1}).then(data => {
    res.send({data});
  })
})

router.get('/check-username-exist', async (req,res) => {
  // #swagger.tags = ['User']

  const {username} = req.query;
  UserService.checkUsername(username).then(data => {
    res.send({
      data: {
        exist: data
      }
    })
  })
})

router.get('/test', async (req, res, next) => {
  // #swagger.tags = ['User']

  UserService.testError().then(()=>{
    res.json({
      data: 'success'
    })
  }).catch(e =>{
    next(e);
  });

})

router.get('/:id/profile', verifyToken, async (req, res, next) => {
  // #swagger.tags = ['User']

  const {id} = req.params;
  try {
    const user = await UserService.getUser(id, {avatar: 1})
    res.status(200).json({
      data: user
    })
  } catch (e) {
    next(e);
  }
})
router.get('/invitations', verifyToken, async (req,res, next) => {
  // #swagger.tags = ['User']
  try {
    const {userId} = req;
    const invites = await UserService.getInvitations(userId);
    res.json({
      data: invites
    })
  } catch (e) {
    next(e)
  }
})

router.get('/sent-requests', verifyToken, async (req,res, next) => {
  // #swagger.tags = ['User']
  try {
    const {userId} = req;
    const sentRequests = await UserService.getSentRequests(userId);
    res.json({
      data: sentRequests
    })
  } catch (e) {
    next(e)
  }
})

router.get('/friend-request', verifyToken, async(req, res, next) => {
  // #swagger.tags = ['User']
  try{
    const {requestId, state} = req.body;
    const {userId} = req;
    await UserService.updateFriendRequest(userId, requestId, state);
  } catch (e) {
    next(e);
  }
})
module.exports = {UserController: router}