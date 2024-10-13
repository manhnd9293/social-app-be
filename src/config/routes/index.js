const {UserController} = require("../../services/user/UserController");
const {companyController} = require("../../services/company/CompanyController");
const {ConversationController} = require("../../services/conversation/ConversationController");
const {RequestController} = require("../../services/request/RequestController");
const {PostController} = require("../../services/post/PostController");
const {NewsFeedController} = require("../../services/newFeed/NewFeedController");
const {TestController} = require("../../services/test/TestController");
const {NotificationController} = require("../../services/notifications/NotificationController");
const {MessageController} = require("../../services/message/MessageController");

function configRoute(app) {
  // app.use((req, res, next) => {
  //   console.log(`${DateTime.now()}: ${req.method} - url: ${req.originalUrl}`)
  //   next();
  // })
  const router = require('express').Router();
  app.use('/api', router)
  router.use('/user', UserController)
  router.use('/company', companyController);
  router.use('/conversations', ConversationController);
  router.use('/request', RequestController);
  router.use('/post', PostController);
  router.use('/news-feed', NewsFeedController);
  router.use('/notifications', NotificationController);
  router.use('/messages', MessageController)
  if( ['dev', 'int'].includes(process.env.NODE_ENV)) {
    router.use('/test', TestController)


    const swaggerFile = require('../../../swagger_output.json');
    const swaggerUi = require('swagger-ui-express');

    router.use( '/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
  }

}


module.exports = {configRoute}