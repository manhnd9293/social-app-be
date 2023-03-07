const {Schema, model} = require('mongoose');

const messageSchema = new Schema({
  conversationId: {type: Schema.Types.ObjectId, ref: 'Conversation', require: true},
  from: {type: Schema.Types.ObjectId, ref: 'User', require: true},
  textContent: {type: String, maxLength : 200},
  seen: [{type: Schema.Types.ObjectId, ref: 'User', default: []}],
  date: {type: Date, default: Date.now()}
})

const MessageModel = model('Message', messageSchema);

module.exports = MessageModel;