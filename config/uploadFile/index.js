const multer = require('multer');

function avatarFileFilter (req, file, cb) {
  const mimetype = file.mimetype;
  if(!['image/jpeg', 'image/png', 'image/gif',].includes(mimetype)){
    cb(null, false);
  }
  // The function should call `cb` with a boolean
  // to indicate if the file should be accepted

  // To reject this file pass `false`, like so:
  // cb(null, false)

  // To accept the file pass `true`, like so:
  cb(null, true)

  // You can always pass an error if something goes wrong:
  // cb(new Error('I don\'t have a clue!'))

}

const avatarLimit = {
  fieldNameSize: 1000,
  fieldSize: 5,
}
const uploadAvatar = multer({dest: 'temp/avatar',limits: avatarLimit,fileFilter: avatarFileFilter})

module.exports = {uploadAvatar}
