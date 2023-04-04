const {Schema, model} = require('mongoose');
const {AccountState, OnlineState} = require("../../utils/Constant");

let friendSchema = new Schema({
    friendId: {type: Schema.Types.ObjectId, ref: 'User'},
    conversationId: {type: Schema.Types.ObjectId, ref: 'Conversation'},
    date: {type: Date, default: Date.now}
});

const userSchema = new Schema({
  username: {type: String, required: true, maxLength: 10, minLength: 3},
  password: {type: String, required: true},
  fullName: {type: String, required: true, maxLength: 50, minLength: 1},
  avatar: {type:String},
  state: {type: String, default: AccountState.Pending},
  onlineState: {type: String, default: OnlineState.Offline},
  friends: [friendSchema],

  dob: {type: Date},
  currentLocation: {type: String},
  hometown: {type: String},
  bio: {type: String, maxLength: 101},
  maritalStatus: {type: String}

})

const UserModel = model('User', userSchema);

module.exports = UserModel;