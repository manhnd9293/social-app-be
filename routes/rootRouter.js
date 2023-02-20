const {EmployeeController} = require("../services/employee/EmployeeController");
const {UserController} = require("../services/user/UserController");
const router = require('express').Router();

router.use('/employee', EmployeeController)
router.use('/user', UserController)

module.exports = {rootRouter: router}