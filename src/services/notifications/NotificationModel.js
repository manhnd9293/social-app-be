const {Schema, model} = require("mongoose");
const notificationSchema = new Schema({
  from: {type: Schema.Types.ObjectId, ref: 'User'},
  to: {type: Schema.Types.ObjectId, ref: 'User'},
  type: {type: String},
  payload: {},
  seen: {type: Boolean, default: false},
  date: {type: Date, default: Date.now}
});

const NotificationModel = model('Notification',notificationSchema);

module.exports = {NotificationModel};



