const {UserService} = require("./UserService");
const {verifyToken} = require("../../middlewares/jwtAuth");
const {HttpError} = require("../../utils/HttpError");
const http = require("http");
const router = require('express').Router();

router.post('/sign-in', async (req, res) => {
  const {username, password} = req.body;
  UserService.login(username, password).then(data => {
    res.send({data})
  }).catch(e => {
    console.log({e})
    res.send({
      status: 403,
      message: e.message
    });
  })
});

router.post('/sign-up', async (req, res) => {
  const {username, password, fullName} = req.body;
  UserService.signUp(username, password, fullName).then((data) => {
    res.send({data})
  }).catch(e => {
    console.log(e)
    res.send({
      status: 403,
      message: e.message,
    })
  })
})

router.get('/me',verifyToken ,async (req, res) => {
  const userId = req;
  UserService.getUser(userId).then(data => {
    res.send({data});
  })

})

router.get('/check-username-exist', async (req,res) => {
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
  // throw 'Invalid request';
  UserService.testError().then(()=>{
    res.json({
      data: 'success'
    })
  }).catch(e =>{
    next(e);
  });

})

module.exports = {UserController: router}