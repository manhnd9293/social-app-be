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

  app.use('/user', UserController)
  app.use('/company', companyController);
  app.use('/conversations', ConversationController);
  app.use('/request', RequestController);
  app.use('/post', PostController);
  app.use('/news-feed', NewsFeedController);
  app.use('/notifications', NotificationController);
  app.use('/messages', MessageController)
  if( ['dev', 'int'].includes(process.env.NODE_ENV)) {
    app.use('/test', TestController)


    const swaggerFile = require('../../../swagger_output.json');
    const swaggerUi = require('swagger-ui-express');

    app.use( '/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
  }

}


module.exports = {configRoute}