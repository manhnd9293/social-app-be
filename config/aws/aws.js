const fs = require('fs');
const path = require('path');
const aws = require('aws-sdk');
aws.config.update({region: process.env.AWS_REGION})

s3 = new aws.S3();


function uploadS3(file) {
  const uploadParams = {Bucket: process.env.S3_BUCKET, Key: '', Body: ''};
  let fileStream = fs.createReadStream(file);
  fileStream.on('error', (err) => {
    console.log('File error', err);
  })
  uploadParams.Body = fileStream;
  uploadParams.Key = path.basename(file);

  return s3.upload(uploadParams, (err, data) => {
    if (err) {
      console.log("Error", err);
    } if (data) {
      console.log(data)
      console.log("Upload Success", data.Location);
    }
  }).promise();
}
module.exports = {aws, s3, uploadS3};
