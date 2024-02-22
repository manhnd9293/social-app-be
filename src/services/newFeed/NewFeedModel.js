const {Schema, model} = require("mongoose");

const NewFeedSchema = new Schema({
  posts: {type: [Schema.Types.ObjectId], ref: 'Post'},
  userId: {type: Schema.Types.ObjectId, ref: 'User'}
})

const NewFeedModel = model('NewFeed' , NewFeedSchema);

module.exports = {NewFeedModel};
