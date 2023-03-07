const {Schema, model} = require('mongoose');

const conversationSchema = new Schema({
  participants: [{type: Schema.Types.ObjectId, require: true, ref: 'User'}],
  date: {type: String, default: Date.now()},
  lastMessageId: {type: Schema.Types.ObjectId, ref: 'Message'}
})

const ConversationModel = model('Conversation', conversationSchema);

module.exports = ConversationModel;