const {S3Client, PutObjectCommand, GetObjectAttributesCommand} = require('@aws-sdk/client-s3');
const fs = require("fs");
const path = require("path");
class AwsS3 {
  constructor() {
    this.client = new S3Client({region: process.env.AWS_REGION});
  }

  async upload(filepath, key) {
    const uploadParams = {Bucket: process.env.S3_BUCKET, Key: '', Body: ''};

    let fileStream = fs.createReadStream(filepath);
    fileStream.on('error', (err) => {
      console.log('File error', err);
    })
    // uploadParams.Body = fileStream;

    const fileKey = key || path.basename(filepath);
    uploadParams.Key = fileKey;
    uploadParams.Body = fileStream;
    const command = new PutObjectCommand(uploadParams);
    return this.client.send(command).then(() => {
      return {
        location: `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`
      }
    })

  }

  getMetadata(key) {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: key
    }

    const command = new GetObjectAttributesCommand(params);
    return this.client.send(command);
  }

}

module.exports = {AwsS3: new AwsS3()}