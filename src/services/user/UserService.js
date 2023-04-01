const UserModel = require("./UserModel");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const { httpError} = require("../../utils/HttpError");
const {AccountState, FriendRequestState} = require("../../utils/Constant");
const RequestModel = require("../request/RequestModel");
const ConversationModel = require("../conversation/ConversationModel");
const MessageModel = require("../message/MessageModel");
const {utils} = require("../../utils/utils");
const fs = require("fs");
const {AwsS3} = require("../../config/aws/s3/s3Config");
const {NotificationModel} = require("../notifications/NotificationModel");
const {ObjectId} = require('mongoose').Types;



class UserService {
  async getUser(id, fields) {
    const defaultPopulate = {username: 1, fullName: 1}
    const user = await UserModel.findOne(
      {_id: id},
      {... defaultPopulate, ...fields})
      .lean();

    const unreadNotifications = await NotificationModel.count({
      to: id,
      seen: false
    })

    const ans = await ConversationModel.aggregate([
      {
        $match: {
          participants: {$all: [new ObjectId(id)]}
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
    const unreadInvitations = await RequestModel.count({
      to: id,
      seen: false,
      state: FriendRequestState.Pending
    })

    return {...user, unreadNotifications, unreadMessages, unreadInvitations};
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
    }).populate({path: 'from', select: {avatar: 1, fullName: 1}});

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
}
module.exports = {UserService: new UserService()}