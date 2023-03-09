const {EmployeeController} = require("../services/employee/EmployeeController");
const {UserController} = require("../services/user/UserController");
const {companyController} = require("../services/company/CompanyController");
const {ConversationController} = require("../services/conversation/ConversationController");

const router = require('express').Router();

router.use('/employee', EmployeeController)
router.use('/user', UserController)
router.use('/company', companyController);
router.use('/conversations', ConversationController);

if( ['dev', 'int'].includes(process.env.NODE_ENV)) {
  const swaggerFile = require('../../swagger_output.json');
  const swaggerUi = require('swagger-ui-express');

  router.use( '/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
}

module.exports = {rootRouter: router}