const UserModel = require("./UserModel");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const { httpError} = require("../../utils/HttpError");
const {AccountState, FriendRequestState, Relation, Media, MutationAction} = require("../../utils/Constant");
const RequestModel = require("../request/RequestModel");
const ConversationModel = require("../conversation/ConversationModel");
const MessageModel = require("../message/MessageModel");
const {utils} = require("../../utils/utils");
const fs = require("fs");
const {AwsS3} = require("../../config/aws/s3/s3Config");
const {NotificationModel} = require("../notifications/NotificationModel");
const {PostModel} = require("../post/PostModel");
const {NewFeedService} = require("../newFeed/NewFeedService");
const {ObjectId} = require('mongoose').Types;



class UserService {
  async getCurrentUser(id) {
    const user = await UserModel.findOne(
      {_id: id},
      {avatar: 1, fullName: 1, friends: 1})
      .lean();
    const unreadNotifications = await NotificationModel.count({
      to: id,
      seen: false
    })

    const ans = await ConversationModel.aggregate([
      {
        $match: {
          _id: {$in: user.friends.map(f => f.conversationId)}
        }
      },
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'conversationId',
          pipeline: [
            {
              $match: {
                from: {$ne: new ObjectId(id)}
              }
            }
          ],
          as: 'messages'
        }
      },
      {
        $unwind: '$messages'
      },
      {
        $match: {
          'messages.seen': {
            $not:           {
              $elemMatch: {
                $eq: ObjectId(id)
              }
            }

          }
        }
      },
      {
        $group: {
          _id: null,
          total: {$sum: 1}
        }
      }
    ]) ;
    const [{total: unreadMessages}] = ans.length > 0 ? ans : [{total: 0}]
    const unseenInvitations = await RequestModel.countDocuments({
      to: id,
      seen: false,
      state: FriendRequestState.Pending
    })

    return {...user, unreadNotifications, unreadMessages, unseenInvitations, friends: undefined};

  }

  async getUserProfile(id) {
    const response = await UserModel.aggregate([
      {
        $match: {_id: ObjectId(id)}
      },
      {
        $lookup: {
          from: 'users',
          localField: 'friends.friendId',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                _id: 1,
                fullName: 1,
                avatar: 1
              }
            }
          ],
          as: 'friendList'
        }
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          avatar: 1,
          friendList: 1,
          works: 1,
          hometown: 1,
          currentPlace: 1,
          relationship: 1,
          bio: 1
        }
      }
    ]);

    const recentPhotos = await this.getRecentPhotos(id, 9);

    return response.length > 0 ? {...response[0], recentPhotos} : {};
  }

  async getRecentPhotos(userId, numbers) {
    const recentPhotos = await PostModel.aggregate([
      {
        $match: {
          userId: ObjectId(userId),
          isDeleted: {$ne: true},
          $expr: {
            $or: [
              {
                $ne: [{$ifNull: ['$photo', -1]}, -1]
              },
              {$gt: [{$size: {$ifNull: ['$photoPosts', []]}}, 0]}
            ]
          }
        }
      },
      {
        $lookup: {
          from: 'photoposts',
          localField: 'photoPosts',
          foreignField: '_id',
          as: 'photoList'
        }
      },
      {
        $project: {
          photo: 1,
          photoList: {
            $cond: [
              {
                $gt: [{$size: '$photoList'}, 0]
              },
              '$photoList',
              [-1]
            ]
          },
          date: 1,
        }
      },
      {
        $unwind: '$photoList'
      },
      {
        $project: {
          url: {$ifNull: ['$photo', '$photoList.url']},
          postPhotoId: {
            $cond: [
              {$ne: [{$ifNull: ['$photo', -1]}, -1]},
              '-1',
              '$photoList._id'
            ]
          },
          media: {
            $cond: [
              {$ne: [{$ifNull: ['$photo', -1]}, -1]},
              Media.Post,
              Media.Photo
            ]
          },
          date: 1
        }
      },
      {
        $sort: {date: -1}
      },
      {
        $limit: numbers
      }
    ]);

    return recentPhotos;
  }

  async getRelationWithCurrentUser(currentUserId, userId) {
    if (currentUserId.toString() === userId.toString()) {
      return Relation.Me;
    }
    const currentUser = await UserModel.findOne({_id: currentUserId}).lean();

    if (currentUser.friends.map(f => f.friendId.toString()).includes(userId.toString())) {
      return Relation.Friend;
    }

    const sentRequest = await RequestModel.findOne({
      from: currentUserId, to: userId, state: FriendRequestState.Pending
    }).lean();
    if (sentRequest) {
      return Relation.SentRequest;
    }
    const receiveRequest = await RequestModel.findOne({
      from: userId, to: currentUserId, state: FriendRequestState.Pending
    });
    if (receiveRequest) {
      return Relation.ReceiveRequest;
    }

    return Relation.Stranger;
  }



  async login(username, password) {
    const user = await UserModel.findOne({username});
    if (!user) {
      throw httpError.badRequest('User not found');
    }

    if (user.state !== AccountState.Active) {
      throw httpError.badRequest('Your account is temporary pending. Please wait for approval from our admin');
    }

    const passwordIsValid = bcrypt.compareSync(
      password,
      user.password
    );
    if (!passwordIsValid) {
      throw httpError.badRequest("Invalid username or password");
    }

    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET ,{
      expiresIn: process.env.JWT_EXPIRE
    })

    return {
      _id: user._id,
      accessToken: token,
      fullName: user.fullName,
      avatar: user.avatar
    }
  }

  async signUp(username, password, fullName) {
    const exist = await UserModel.findOne({username});
    if (exist) {
      throw 'Username existed';
    }

    const user = await new UserModel({
      username,
      password: bcrypt.hashSync(password, 8),
      fullName,
      state: process.env.NODE_ENV === 'production' ? AccountState.Pending: AccountState.Active
    }).save()

    return {
      _id: user._id,
      accessToken: null,
      fullName,
      message: 'Your registration is success. Please wait for approval from our admin'
    }
  }

  generateAccessToken(userId) {
    const token = jwt.sign({id: userId}, process.env.JWT_SECRET ,{
      expiresIn: process.env.JWT_EXPIRE
    })

    return token;
  }

  async checkUsername(username) {
    const user = await UserModel.findOne({username}).lean();

    return !!user;
  }

  async testError() {
    await UserModel.findOne({});
    throw httpError.badRequest('User existed');
  }

  async getInvitations(userId) {
    const check = await UserModel.findOne({_id: userId});
    if (!check) {
      throw 'User not found'
    }

    let invites = await RequestModel.find({
      to: userId,
      state: FriendRequestState.Pending
    }).populate({path: 'from', select: {avatar: 1, fullName: 1}}).sort({_id: -1}).lean();

    return invites;
  }

  async getSentRequests(userId) {
    const check = await UserModel.findOne({_id: userId});
    if (!check) {
      throw 'User not found'
    }

    let sentRequests = await RequestModel.find({
      from: userId,
      state: FriendRequestState.Pending
    }).populate({path: 'to', select: {avatar: 1, fullName: 1}});

    return sentRequests;
  }

  async getFriendList(userId) {
    return UserModel.findOne({
      _id: userId
    }, {
      friends: {
        friendId: 1,
        date: 1,
        conversationId: 1
      }
    }).populate({path: 'friends.friendId', select: {avatar: 1, fullName: 1}});

  }

  async unfriend(userId, unfriendId) {
    if (!unfriendId) {
      throw httpError.badRequest("No user to unfriend");
    }
    let {friends} = await UserModel.findOne({
      _id: userId
    }, {friends: 1}).lean();

    if (!friends.map(friend => friend.friendId.toString()).includes(unfriendId)) {
      throw httpError.badRequest('Unfriend user not in friend list of current user');
    }

    await UserModel.updateOne({
      _id: userId
    }, {
      $pull: {
        friends: {
          friendId: unfriendId
        }
      }
    });

    await UserModel.updateOne({
      _id: unfriendId
    }, {
      $pull: {
        friends: {
          friendId: userId
        }
      }
    })

    await RequestModel.updateOne({
      from: {$in: [userId, unfriendId]},
      to: {$in: [userId, unfriendId]},
      state: FriendRequestState.Accepted
    },
    {
      $set: {
        state: FriendRequestState.Terminate
      }
    })

  }

  async getUsers({search, userId}) {
    const currentUser = await UserModel.findOne({_id: userId}, {friends: 1}).lean();
    const friends = currentUser.friends.map(f => f.friendId.toString());
    const friendsSet = new Set(friends);
    const sentRequests = await RequestModel.find({
      from: userId,
      state: FriendRequestState.Pending
    }).lean();
    const receivedRequests = await RequestModel.find({
      to: userId,
      state: FriendRequestState.Pending
    }).lean();
    const sentRequestSet = new Set(sentRequests.map(r => r.to.toString()));
    const receiveRequestSet = new Set(receivedRequests.map(r => r.from.toString()));


    const escapeRegExp = utils.escapeRegExp(search || '', 'i');
    const users = await UserModel.find({
      $or: [
        {
          username: {
            $regex: new RegExp(escapeRegExp),
          }

        },
        {
          fullName: {
            $regex: new RegExp(escapeRegExp)
          }
        },
      ],
      state: AccountState.Active,
      _id: {$ne: userId},
    }, {
      username: 1,
      fullName: 1,
      avatar: 1
    }).lean();

    for (let user of users) {
      const currentUserId = user._id.toString();
      if (friendsSet.has(currentUserId)) {
        user.isFriend = true;
      }
      if (sentRequestSet.has(currentUserId)) {
        user.sentRequest = true;
      }

      if (receiveRequestSet.has(currentUserId)) {
        user.receiveRequest = true;
      }
    }

    return users;
  }

  async updateAvatar(userId, file) {
    const filepath = file.path;
    const user = await UserModel.findOne({_id: userId}).lean();
    const key = `user/${user.username}/avatar/${file.filename}`;
    const data = await AwsS3.upload(filepath, key).then(async (res) => {
      const {location} = res;
      await UserModel.updateOne(({_id: userId}),
        {
          $set: {
            avatar: location
          }
        })

      return {avatar: location}
    });
    fs.unlink(filepath, (err) => {
      if (err) {
        console.log(`Fail to upload`)
      }
      console.log('delete temp file success');
    });

    return data;
  }

  async getTimeline(userId, profileId ,page) {
    const posts = await NewFeedService.getPosts(userId, [new ObjectId(profileId)], page);
    return posts;
  }

  async mutateAboutData(userId, operation) {
    const action = Object.keys(operation)[0];
    if(!action) {
      throw httpError.badRequest('No action found');
    }
    const updateData = operation[action];
    const field = Object.keys(updateData)[0];
    if (!field) {
      throw httpError.badRequest(`update field is required`);
    }

    const data = updateData[field];
    if (!data) {
      throw httpError.badRequest(`No update data found`);
    }

    switch (action) {
      case MutationAction.Push:
        return await this.pushAboutInfo(userId, field, data);
      case MutationAction.Update:
        return await this.updateAboutInfo(userId, field, data);
      case MutationAction.Pull:
        return await this.pullAboutInfo(userId, field, data);
      case MutationAction.Delete:
        return await this.deleteAboutInfo(userId, field, data);
      default:
        throw httpError.badRequest('Invalid action');
    }
  }

  async pushAboutInfo(userId, field, data) {
    await UserModel.updateOne({
        _id: userId
      },
      {
        $push: {
          [field]: data
        }
      });

    const res = await UserModel.findOne({
      _id: userId
    }, {
      [field]: 1,
    }).lean();
    const latest = res[field][res[field].length -1];
    return {_id: latest._id};
  }

  async updateAboutInfo(userId, field, data) {
    const fieldInstance = UserModel.schema.path(field)?.instance;

    if(fieldInstance === 'Array') {
      const _id = data._id;

      if (!_id) {
        throw httpError.badRequest('_id field is required');
      }

      await UserModel.updateOne({
        _id: userId,
        [field]: {
          $elemMatch: {
            _id
          }
        }
      }, {
        $set: {
          [`${field}.$`]: data
        }
      });

    } else if(fieldInstance === 'String' || fieldInstance === 'Embedded') {

      await UserModel.updateOne({
        _id: userId,
      }, {
        $set: {
          [field]: data
        }
      })
    }
  }

  async pullAboutInfo(userId, field, data) {
    const _id = data?._id;
    if (!_id) {
      throw httpError.badRequest(`_id field is required`);
    }

    await UserModel.updateOne({
      _id: userId,
    },
      {
        $pull: {
          [field]: {
            _id
          }
        }
      })
  }

  async deleteAboutInfo(userId, field) {
    await UserModel.updateOne({
        _id: userId
      },
      {
        $set: {
          [field]: null
        }
      })
  }

}
module.exports = {UserService: new UserService()}