const {Schema, model} = require("mongoose");
const employeeSchema = new Schema({
  name: {type: String, required: true},
  dob: {type: Date}
})

const EmployeeModel = model('Employee', employeeSchema);

module.exports = EmployeeModel;
