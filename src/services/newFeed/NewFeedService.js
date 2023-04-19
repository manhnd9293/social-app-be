const {PostModel, ReactionModel} = require("../post/PostModel");
const {httpError} = require("../../utils/HttpError");
const UserModel = require("../user/UserModel");
const {Media} = require("../../utils/Constant");
const {ObjectId} = require('mongoose').Types;

class NewFeedService {
  async getNewFeeds(userId, lastId) {
    const currentUsers = await UserModel.findOne({_id: userId}, {friends: 1}).lean();
    const friendsIds = currentUsers.friends.map(f => new ObjectId(f.friendId));
    const userIdsToGet = [new ObjectId(userId), ...friendsIds];
    const posts = await this.getPosts(userId, userIdsToGet, lastId);
    return posts;
  }

  async getPosts(userId, userIds, lastId) {
    const posts = await PostModel.aggregate([
      {
        $match: {
          userId: {$in: userIds},
          isDeleted: {$ne: true},
          ... lastId ? {_id: {$lt: new ObjectId(lastId)}} : {}
        }
      },
      {
        $sort: {
          _id: -1,
        }
      },
      {
        $limit: 20
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'byUsers'
        }
      },
      {
        $addFields: {
          byUser: {$arrayElemAt: ['$byUsers', 0]}
        }
      },
      {
        $lookup: {
          from: 'comments',
          let: {media_id: '$_id'},
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {$eq: ['$mediaType', 'post']},
                    {$eq: ['$mediaId', '$$media_id']},
                    {$ne: ['$isDeleted', true]}
                  ]
                }
              }
            }
          ],
          as: 'comments'
        }
      },
      {
        $lookup: {
          from: 'photoposts',
          foreignField: '_id',
          localField: 'photoPosts',
          pipeline: [
            {
              $project: {
                _id: 1,
                url: 1,
                caption: 1
              }
            }
          ],
          as: 'photoPostList'
        }
      },
      {
        $project: {
          _id: 1,
          content: 1,
          totalReaction: 1,
          date: 1,
          comments: {$size: '$comments'},
          'byUser.fullName':1,
          'byUser._id':1,
          'byUser.avatar':1,
          photo: 1,
          photoPosts: '$photoPostList',
        }
      }
    ]);

    const postIds = posts.map(post => post._id);
    const reactions = await ReactionModel.find({mediaId: {$in: postIds}, mediaType: Media.Post, userId}).lean();
    const postIdToReaction = reactions.reduce((map, reaction) => {
      const postId = reaction.mediaId.toString();
      map.set(postId, reaction);
      return map;
    }, new Map());

    posts.forEach(post => {
      const postId = post._id.toString();
      if (postIdToReaction.has(postId)) {
        post.reaction = postIdToReaction.get(postId).type;
      }
    })

    return posts;
  }
}

module.exports = {NewFeedService: new NewFeedService()}
