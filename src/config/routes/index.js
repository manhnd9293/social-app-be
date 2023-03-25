const {UserController} = require("../../services/user/UserController");
const {companyController} = require("../../services/company/CompanyController");
const {ConversationController} = require("../../services/conversation/ConversationController");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("../../../swagger_output.json");
const {DateTime} = require("luxon");
const {RequestController} = require("../../services/request/RequestController");
const {PostController} = require("../../services/post/PostController");

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

  if( ['dev', 'int'].includes(process.env.NODE_ENV)) {
    app.get('/test', async (req, res) => {
      res.json('test');
    });

    const swaggerFile = require('../../../swagger_output.json');
    const swaggerUi = require('swagger-ui-express');

    app.use( '/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
  }

}


module.exports = {configRoute}