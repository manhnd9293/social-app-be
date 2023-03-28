const {Schema, model} = require("mongoose");
const { Reaction } = require("../../utils/Constant");

const ReactionSchema = new Schema({
  type: {
    type: String,
    enum: {
      values: Object.values(Reaction),
      message: '${VALUE} is not supported'
    },
  },
  mediaType: {type: String}, // to post, photo, comment
  userId: {type: Schema.Types.ObjectId, ref: 'User'},
  mediaId: {type: Schema.Types.ObjectId},
  date: {type: Date, default: Date.now}
})

totalReactionSchema = new Schema({
  type: String,
  value: {type: Number, default: 0}
})

const CommentSchema = new Schema({
  userId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  content: {type: String, maxLength: 20000, required: true},
  date: {type: Date, default: Date.now},
  mediaType: {type: String}, // of post or photo,
  mediaId: {type: Schema.Types.ObjectId},
  totalReaction: {type: [totalReactionSchema], default: []},
  isDeleted: {type: Boolean, required: false}
});

const shareSchema = new Schema({
  userId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  date: {type: Date, default: Date.now},
  postId: {type: Schema.Types.ObjectId, ref: 'Post'}
})

const PhotoSchema = new Schema({
  url: {type: String},
  caption: {type: String, maxLength: 20000},
  date: {type: Date, default: Date.now},
  totalReaction: {type: [totalReactionSchema]},
  isDeleted: {type: Boolean, required: false},
  parentPost: {type: Schema.Types.ObjectId, ref: 'Post', required: true}
})

const PostSchema = new Schema({
  userId: {type: Schema.Types.ObjectId, ref: 'User'},
  content: {type: String, maxLength: 20000, required: true},
  photoPosts: {type: [{type: Schema.Types.ObjectId, ref: 'PhotoPost'}], default: []},
  photo: {type: String},
  date: {type: Date, default: Date.now},
  recentComments: {type: [{type: Schema.Types.ObjectId, ref: 'Comment'}], default: []},
  totalReaction: {type: [totalReactionSchema]},
  isDeleted: {type: Boolean, required: false}
});


const PhoToPostModel = model('PhotoPost', PhotoSchema);
const ShareLogModel = model('Share', shareSchema);
const ReactionModel = model('Reaction', ReactionSchema);
const PostModel = model('Post', PostSchema);
const CommentModel = model('Comment', CommentSchema);

module.exports = {PostModel, CommentModel, PhoToPostModel, ReactionModel, ShareLogModel}