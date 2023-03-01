const CompanyModel = require("./CompanyModel");
const {httpError} = require("../../utils/HttpError");
const {AwsS3} = require("../../config/aws/s3/s3Config");
const {utils} = require("../../utils/utils");
const fs = require("fs");

class CompanyService {
  constructor() {
    this.companyModel = CompanyModel;
  }

  async create({name, industry, province, address, introduction}) {


    return this.companyModel.create({
      name, industry, province, address, introduction
    })
  }

  async checkNameExist(name) {
    const check = await this.companyModel.findOne({name: utils.getCleanName(name)}).lean();
    return !!check;
  }

  getCompany(id) {
    return this.companyModel.findOne({
      _id: id
    }).then(res => {
      if(!res) {
        throw httpError.badRequest(`company not exist`);
      }

      return res;
    });
  }

  async uploadLogo(companyId, filepath) {
    const company = await this.companyModel.findOne({
      _id: companyId
    }, {
      _id: 1,
      name: 1
    }).lean();

    if (!company) {
      throw httpError.badRequest('Company does not exist');
    }

    const key = `company/${utils.getCleanName(company.name)}/logo`;
    return AwsS3.upload(filepath, key).then(async (res) => {
      const {location} = res;
      await this.companyModel.updateOne({_id: companyId}, {
        $set: {
          logo: location
        }
      });

      return location;
    }).then((location) => {
      return new Promise((resolve, reject) => {
        fs.unlink(filepath, err => {
          if(err) {
            // reject('Fail to delete file');
            console.log(`fail to delete temp file of company ${company.name} - ${company._id}. Error: ${err.message}`);
          } else {
            console.log('delete temp file logo successfully');
          }
          resolve(location);
        })
      })
    }).catch(e => {
      throw e;
    });
  }

  async getListCompany({search, page, industry, province}) {
    const searchCondition = {
      ... search ? {name: {$regex: new RegExp(utils.escapeRegExp(search), 'i')} } : {},
      ... industry ? {industry} : {},
      ... province ? {province} : {}
    };
    const companies = await this.companyModel.find(searchCondition, {
      _id: 1,
      logo: 1,
      name: 1,
      industry: 1,
      province: 1
    }).skip((page - 1) * 10).limit(10);

    const total = await this.companyModel.count(searchCondition);

    return {
      companies,
      total
    }

  }
}

module.exports = {companyService: new CompanyService()}