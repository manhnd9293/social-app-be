const {EmployeeController} = require("../controller/EmployeeController");
const {UserController} = require("../controller/UserController");
const router = require('express').Router();

router.use('/employee', EmployeeController)
router.use('/user', UserController)

module.exports = {rootRouter: router}