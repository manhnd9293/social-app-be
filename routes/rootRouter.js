const {EmployeeController} = require("../services/employee/EmployeeController");
const {UserController} = require("../services/user/UserController");
const {companyController} = require("../services/company/CompanyController");
const router = require('express').Router();

router.use('/employee', EmployeeController)
router.use('/user', UserController)
router.use('/company', companyController)

module.exports = {rootRouter: router}