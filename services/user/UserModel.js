const {Schema, model} = require('mongoose');
const {AccountState} = require("../../utils/Constant");

const userSchema = new Schema({
  username: {type: String, required: true, maxLength: 10, minLength: 3},
  password: {type: String, required: true},
  fullName: {type: String, required: true, maxLength: 50, minLength: 1},
  avatar: {type:String},
  state: {type: String, default: AccountState.Pending}
})

const UserModel = model('User', userSchema);

module.exports = UserModel;