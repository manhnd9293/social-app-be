const {EmployeeService} = require("./EmployeeService");
const {uploadAvatar} = require("../../config/uploadFile");
const fs = require("fs");
const {AwsS3} = require("../../config/aws/s3/s3Config");
let router = require('express').Router();

router.get('/', async (req, res) => {
  console.log(`get employee`);
  EmployeeService.getEmployees().then(data => {
    res.send({
      status: '200',
      data
    });
  })
})

router.post('/', async (req, res) => {
  const data = req.body;
  EmployeeService.createEmployee(data).then((newEmployee)=> {
    res.send({
      status: 'sucess',
      data: newEmployee
    })
  });
})



router.patch('/upload', uploadAvatar.single('file') ,async (req, res) => {
  const file = req.file;
  let filePath = file.path;
  AwsS3.upload(filePath).then(data => {
    console.log({data})
    res.send({
      message: 'success',
      url: data.Location
    })
  }).then(() => {
    fs.unlink(filePath, function(err){
      if(err) return console.log(err);
      console.log('file deleted successfully');
    });
  });
})


module.exports = {EmployeeController: router}