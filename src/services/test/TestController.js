const {uploadPostPhoto} = require("../../config/uploadFile");
const router = require('express').Router();

router.post('',uploadPostPhoto.single('file') ,async (req, res) => {
  console.log(req.body);
  res.json({
    data: req.body

  });
});

router.get('', async (req, res) => {
  const {lastId} = req.query;

  const maxId = 45;
  const lastIdNumber = Number(lastId);
  const data = [...Array(10).keys()].map(i => lastIdNumber + i + 1).filter(i => i <= 45);

  res.json({
    items: data,
    hasNext: lastIdNumber < maxId - 10 ? true : false
  });
});

module.exports = {TestController: router};
