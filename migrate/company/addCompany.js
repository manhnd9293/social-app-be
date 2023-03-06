const CompanyModel = require("../../src/services/company/CompanyModel");
const {connectDb} = require("../../src/config/db/mongo");
require('dotenv').config();

async function addCompany() {
  await connectDb();
  const companies = [
    {
      name: 'Vin Home',
      province: 'Hanoi',
      image: 'https://downloadlogomienphi.com/sites/default/files/logos/download-logo-vector-vinhome-mien-phi.jpg',
      industry: 'Real estate',
      size: 'More than 10000'
    },
    {
      name: 'Vin Fast',
      province: 'Hanoi',
      image: 'https://inkythuatso.com/uploads/images/2021/10/logo-vinfast-inkythuatso-21-11-08-55.jpg',
      industry: 'Car',
      size: 'More than 10000'
    },
    {
      name: 'PwC',
      province: 'Hanoi',
      image: 'https://brademar.com/wp-content/uploads/2022/05/PwC-Logo-PNG-2010-%E2%80%93-Now-1.png',
      industry: 'Financial Service',
      size: 'More than 10000'
    },
    {
      name: 'Samsung',
      province: 'Hanoi',
      image: 'https://1000logos.net/wp-content/uploads/2017/06/Samsung-Logo-2.png',
      industry: 'Electronics',
      size: 'More than 10000'
    },
    {
      name: 'Toyota',
      province: 'Hanoi',
      image: 'https://global.toyota/pages/global_toyota/mobility/toyota-brand/emblem_ogp_001.png',
      industry: 'Automobile',
      size: 'More than 10000'
    },
    {
      name: 'Google',
      province: 'Ho Chi Minh',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/2048px-Google_%22G%22_Logo.svg.png',
      industry: 'Information Technology',
      size: 'More than 10000'
    },
    {
      name: 'Shopee',
      province: 'Hanoi',
      image: 'https://cf.shopee.ph/file/281963778cd53e255294e126298ce124',
      industry: 'Tourist',
      size: 'More than 10000'
    },
    {
      name: 'Dat Xanh',
      province: 'Hanoi',
      image: 'https://danhkhoireal.vn/wp-content/uploads/2019/11/logo-dat-xanh-group.jpg',
      industry: 'Real estate',
      size: 'More than 10000'
    },
  ];

  const datas = companies.map( com => {
    return {
      name: com.name,
      province: com.province,
      logo: com.image,
      address: 'Hanoi',
      industry: com.industry,
      size: com.size
    }
  })

  for(let d of datas) {
    await CompanyModel.create(d);
  }
  console.log('Done add data');
}

addCompany().then(() => {
  console.log('migrate data successfully');
  process.exit()
}).catch(e => {
  console.log('Fail to migrate data');
  process.exit();
});