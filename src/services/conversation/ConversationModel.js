const {Schema, model} = require('mongoose');

const conversationSchema = new Schema({
    participants: [{type: Schema.Types.ObjectId, require: true, ref: 'User'}],
    date: {type: Date, default: Date.now},
    lastMessageId: {type: Schema.Types.ObjectId, ref: 'Message'}
  },
  {
    toJSON: {virtuals: true},
    toObject: {virtuals: true},
  })


const ConversationModel = model('Conversation', conversationSchema);

module.exports = ConversationModel;