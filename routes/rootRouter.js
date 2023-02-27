const {EmployeeController} = require("../services/employee/EmployeeController");
const {UserController} = require("../services/user/UserController");
const {companyController} = require("../services/company/CompanyController");
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('../swagger_output.json');
const {jwtAuth} = require("../middlewares");
const {verifyToken} = require("../middlewares/jwtAuth");

const router = require('express').Router();

router.use('/employee', EmployeeController)
router.use('/user', UserController)
router.use('/company', companyController)
router.use( '/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

module.exports = {rootRouter: router}