const {Schema, model} = require('mongoose');
const {AccountState} = require("../../utils/Constant");

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
  friends: [friendSchema],

})

const UserModel = model('User', userSchema);

module.exports = UserModel;