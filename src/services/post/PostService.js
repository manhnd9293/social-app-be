const {PostModel, ReactionModel, PhoToPostModel, CommentModel} = require("./PostModel");
const {httpError} = require("../../utils/HttpError");
const {Reaction, Media, NotificationType} = require("../../utils/Constant");
const UserModel = require("../user/UserModel");
const {NewFeedModel} = require("../newFeed/NewFeedModel");
const {AwsS3} = require("../../config/aws/s3/s3Config");
const fsPromises = require('node:fs/promises')
const {NotificationService} = require("../notifications/NotificationService");
const {ObjectId} = require('mongoose').Types;

class PostService {
  async create(userId, postData, photoFiles) {
    if (!postData) {
      throw httpError.badRequest('Post data not found');
    }
    const {content, captions} = postData;

    if (!content) {
      throw httpError.badRequest('post content not found');
    }

    if (photoFiles.length > 5) {
      const unlinkPromises = [];
      photoFiles.forEach(file => {
        unlinkPromises.push(fsPromises.unlink(file.path));
      })

      Promise.all(unlinkPromises).then(() => {
        throw httpError.badRequest('Too many photos, limit photo is 5');
      })
    }

    const post = await PostModel.create({
      userId,
      content,
    });

    const user = await UserModel.findOne({_id: userId});
    if(photoFiles.length === 1) {
      const file =  photoFiles[0];
      const {path} = file;
      const key = `user/${user.username}/post/${post._id.toString()}/photo/${file.filename}`;
      const uploadData = await AwsS3.upload(path, key);
      const {location} = uploadData;
      await PostModel.updateOne({
        _id: post._id
      }, {
        $set: {
          photo: location
        }
      });
    } else if(photoFiles.length > 1) {
      const photoPostIds = [];
      for (let i=0; i< photoFiles.length; i++) {
        const file = photoFiles[i];
        const caption = captions[i];
        const {path} = file;
        const photoPost = await PhoToPostModel.create({
          caption,
          parentPost: post._id,
        });
        const key = `user/${user.username}/post/${post._id.toString()}/photoPost/${photoPost._id.toString()}`;
        const uploadData = await AwsS3.upload(path, key);
        await PhoToPostModel.updateOne({
          _id: photoPost._id
        }, {
          $set: {
            url: uploadData.location
          }
        });
        photoPostIds.push(photoPost._id);
      }
      await PostModel.updateOne({
        _id: post._id
      }, {
        $set: {
          photoPosts: photoPostIds
        }
      })
    }

    const unlinkPromises = [];
    photoFiles.forEach(file => {
      unlinkPromises.push(fsPromises.unlink(file.path));
    })

    Promise.all(unlinkPromises).then(() => {
      console.log('remove photo post success');
    })

    this.updateFriendsNewFeed(userId, post.toObject());
    return post;
  }

  async updateFriendsNewFeed(userId, post) {
    const {friends} = await UserModel.findOne({_id: userId}, {friends: 1}).lean();
    for (let friend of friends) {
      const {friendId} = friend;
      const newFeed = await NewFeedModel.findOne({userId: friendId});
      if(!newFeed){
        // case user never get new feed
        continue;
      }

      newFeed.posts.push(post._id);
      if(newFeed.posts.length > process.env.NEWS_FEED_CACHE) {
        newFeed.posts.shift(0);
      }

      await newFeed.save();
    }
  }

  async updateReact(userId,media ,mediaId, react ) {
    if (!react) {
      throw httpError.badRequest('React not found');
    }

    if (!Object.values(Reaction).includes(react)) {
      throw httpError.badRequest('Invalid react data');
    }

    if (!mediaId) {
      throw httpError.badRequest('no mediaDocs id provided');
    }

    const mediaModel = this.getModelFromMedia(media);
    const mediaDocs = await mediaModel.findOne({_id: mediaId}).lean();
    if (!mediaDocs) {
      throw httpError.badRequest(`${media} not found`);
    }

    const check = await ReactionModel.findOne({mediaType: media, mediaId: mediaId, userId}).lean();
    if (check && check.type === react) {
      throw httpError.badRequest('User reacted before');
    }
    if (check && check.type !== react) {
      await ReactionModel.deleteOne({mediaType: media, mediaId, userId});
      await mediaModel.updateOne({
        _id: mediaId,
        totalReaction: {
          $elemMatch: {
            type: check.type
          }
        }
      }, {
        $inc: {
          'totalReaction.$.value': -1
        }
      })
    }
    await ReactionModel.create({mediaType: media, mediaId: mediaId, userId, type: react});

    const currentReactCount = mediaDocs.totalReaction.find(r => r.type === react);
    if (!currentReactCount) {
      await mediaModel.updateOne({
        _id: mediaId,
      }, {
        $push: {
          totalReaction: {
            type: react,
            value: 1
          }
        }
      })
    } else {
      await mediaModel.updateOne({
        _id: mediaId,
        totalReaction: {
          $elemMatch: {
            type: react
          }
        }
      }, {
        $inc: {
          "totalReaction.$.value": 1
        }
      });
    }

    const {totalReaction} = await mediaModel.findOne({_id: mediaId}, {totalReaction: 1}).lean();
    NotificationService.notify({
      from: userId, to: mediaDocs.userId, type: NotificationType.Reaction, payload: {
        media, mediaId, reaction: react
      }
    });
    return totalReaction;
  }

  async unReact(userId, mediaId, mediaType) {
    const reaction = await ReactionModel.findOne({userId, mediaId, mediaType});
    if(!reaction) {
      throw httpError.badRequest('Reaction not found');
    }
    await ReactionModel.deleteOne({userId, mediaId, mediaType});
    const mediaModel = this.getModelFromMedia(mediaType);

    await mediaModel.updateOne({
      _id: mediaId,
      totalReaction: {
        $elemMatch: {
          type: reaction.type
        }
      }
    }, {
      $inc: {
        'totalReaction.$.value': -1
      }
    });

    const {totalReaction} = await mediaModel.findOne({_id: mediaId}, {totalReaction: 1}).lean();
    return totalReaction;
  }


  getModelFromMedia(media) {
    switch (media) {
      case Media.Post:
        return PostModel;
      case Media.Photo:
        return PhoToPostModel;
      case Media.Comment:
        return CommentModel;
      default:
        throw new Error('Invalid type')
    }
  }

  async comment(commentUserId, content, mediaId, mediaType) {
    const commentUser = await UserModel.findOne({_id: commentUserId});
    if (!commentUser) {
      throw httpError.badRequest('User not exist');
    }

    if (![Media.Post, Media.Photo].includes(mediaType)) {
      throw httpError.badRequest('Invalid media type');
    }
    const mediaModel = this.getModelFromMedia(mediaType);
    const post = await mediaModel.findOne({_id: mediaId, isDeleted: {$ne: true}},
      {
        userId: 1
      },
      {
        populate: {
          path: 'userId',
          select: {
            friends: 1,
            _id: 1
          }
        }
      }).lean();
    if (!post) {
      throw httpError.badRequest('Post not exist')
    }
    const postOwnerFriends = post.userId.friends;
    if ( post.userId._id.toString() !== commentUserId &&
      !postOwnerFriends.find(friend => friend.friendId.toString() === commentUserId) ) {
      throw httpError.badRequest('Only friend of post owner can comment');
    }

    await CommentModel.create({
      content,
      mediaType: mediaType,
      mediaId: mediaId,
      userId: commentUserId
    });
  }

  async getComments(id) {
    const comments = await CommentModel.find({
      mediaType: Media.Post,
      mediaId: id,
      isDeleted: {$ne: true}
    }, {
      userId: 1,
      content: 1,
      totalReaction: 1,
      date: 1
    }, {
      populate: [
        {path: 'userId', select: {fullName: 1, avatar: 1}}
      ],
      sort: {
        date: -1
      }
    },
).lean();

    return comments;
  }
}

module.exports = {PostService: new PostService()}