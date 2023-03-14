const {UserController} = require("../services/user/UserController");
const {companyController} = require("../services/company/CompanyController");
const {ConversationController} = require("../services/conversation/ConversationController");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("../../swagger_output.json");


function configRoute(app) {
  app.use('/user', UserController)
  app.use('/company', companyController);
  app.use('/conversations', ConversationController);

  if( ['dev', 'int'].includes(process.env.NODE_ENV)) {
    const swaggerFile = require('../../swagger_output.json');
    const swaggerUi = require('swagger-ui-express');

    app.use( '/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
  }

}


module.exports = {configRoute}