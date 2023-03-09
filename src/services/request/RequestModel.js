const {Schema, model} = require("mongoose");
const {FriendRequestState} = require("../../utils/Constant");

const requestSchema = new Schema({
  from: {type: Schema.Types.ObjectId, ref: 'User' },
  to: {type: Schema.Types.ObjectId, ref: 'User' },
  message: {type: String, maxLength: 200},
  seen: {type: Boolean, default: false},
  date: {type: Date, default: Date.now()},
  state: {
    type: String,
    enum: {
      values: Object.values(FriendRequestState),
      message: '${VALUE} is not supported'
    },
    default: FriendRequestState.Pending,
  }
})

const RequestModel = model('Request', requestSchema);
module.exports = RequestModel;