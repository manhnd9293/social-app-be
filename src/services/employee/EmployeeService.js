const EmployeeModel = require("./EmployeeModel");

class EmployeeService {

  async getEmployees() {
    return EmployeeModel.find({}).lean()
  }

  async createEmployee(data) {
    return new EmployeeModel(data).save();
  }

}

module.exports = {EmployeeService : new EmployeeService()}