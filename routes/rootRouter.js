const {EmployeeController} = require("../controller/EmployeeController");
const router = require('express').Router();

router.use('/employee', EmployeeController)

module.exports = {rootRouter: router}