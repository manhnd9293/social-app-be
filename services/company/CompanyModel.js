const {Schema, model} = require('mongoose');
const companySchema = new Schema({
  name: {type: String, required: true},
  industry: {type: String, required: true},
  province: {type: String, required: true},
  address: {type: String, required: true},
  logo: {type: String},
  introduction: {type: String, required: true},
});

const CompanyModel = model('Company', companySchema)

module.exports = CompanyModel;