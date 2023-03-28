const {uploadPostPhoto} = require("../../config/uploadFile");
const router = require('express').Router();

router.post('',uploadPostPhoto.single('file') ,async (req, res) => {
  console.log(req.body);
  res.json({
    data: req.body

  });
});

router.get('', async (req, res) => {
  res.json({
    data: req.body

  });
})

module.exports = {TestController: router};
