const {companyService} = require("./CompanyService");
const {uploadAvatar} = require("../../config/uploadFile");
const {AwsS3} = require("../../config/aws/s3/s3Config");
const router = require('express').Router();

router.post('/', async (req, res, next) => {
  // #swagger.tags = ['Company']
  const data = req.body;

  companyService.create(data).then(data => {
    res.json({
      data,
    })
  }).catch(e=> {
    next(e);
    return
  });
})


router.get('/check-name-exist', async (req,res, next) => {
  // #swagger.tags = ['Company']

  const {name} = req.query;
  companyService.checkNameExist(name).then(data => {
    res.json({
      exist: data
    })
  }).catch(e => {
    next(e);
  })

})
router.get('/', async (req, res, next) => {
  // #swagger.tags = ['Company']
  const {search, province, industry, page} = req.query;
  try {
    const responseData = await companyService.getListCompany({search, province, industry, page});
    res.status(200).json(responseData);
  } catch (e) {
    next(e);
  }

})

router.get('/:id', async (req, res, next) => {
  // #swagger.tags = ['Company']

  const {id} = req.params;
  companyService.getCompany(id).then(data => {
    res.json({data})
  }).catch(e => {
    next(e);
  })
})


router.patch('/:id/logo',uploadAvatar.single('file'), async (req, res, next) => {
  // #swagger.tags = ['Company']

  const {file : {path: filepath}} = req;
  const {id} = req.params;
  companyService.uploadLogo(id,filepath).then(location => {
    res.json(
      {
        data: {
          url: location
        }
      });
  }).catch(e => {
    next(e)
  });

})

module.exports = {companyController: router}
