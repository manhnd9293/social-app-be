const UserModel = require("./UserModel");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const { httpError} = require("../../utils/HttpError");
const {AccountState, FriendRequestState} = require("../../utils/Constant");
const RequestModel = require("../request/RequestModel");
const ConversationModel = require("../conversation/ConversationModel");
const MessageModel = require("../message/MessageModel");
const {utils} = require("../../utils/utils");


class UserService {
  async getUser(id, fields) {
    const defaultPopulate = {username: 1, fullName: 1}
    const user = await UserModel.findOne(
      {_id: id},
      {... defaultPopulate, ...fields})
      .lean();

    return user;
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

  async updateFriendRequest(userId, requestId, state) {
    const request = await RequestModel.findOne({
      _id: requestId
    }).lean();

    if (!request) {
      throw httpError.badRequest('Request not exist');
    }

    const fromUser = await UserModel.findOne({_id: request.from}).lean();
    if (!fromUser) {
      throw httpError.badRequest('User not existed');
    }

    if (userId !== request.to.toString()) {
      throw httpError.unauthorize('You are not allowed to accept this request');
    }

    if (request.state !== FriendRequestState.Pending) {
      throw httpError.badRequest('Request error ')
    }
    if (![FriendRequestState.Accepted, FriendRequestState.Decline].includes(state)) {
      throw httpError.badRequest('Invalid update state');
    }

    await RequestModel.updateOne({
      _id: requestId
    },{
      $set: {
        state
    }
  })

  if (state === FriendRequestState.Decline) {
  return 'update success';
}
let conversation = await ConversationModel.findOne({
  participants: {
    $size: 2,
    $all: [request.from, userId]
  }}).lean();

if (!conversation) {
  conversation = await ConversationModel.create({
        participants: [request.from, userId]
      });

    }

    let conversationId = conversation._id;
    if (request.message) {
      const message = await MessageModel.create({
        conversationId,
        from: request.from,
        date: request.date,
        textContent: request.message
      })
      await ConversationModel.updateOne({
        _id: conversationId
      }, {
        $set: {
          lastMessageId: message._id
        }
      });
    }

    await UserModel.updateOne({
      _id: userId
    }, {
      $push: {
        friends: {
          friendId: request.from,
          conversationId,
          date: Date.now()
        }
      }
    })

    await UserModel.updateOne({
      _id: request.from
    }, {
      $push: {
        friends: {
          friendId: userId,
          conversationId,
          date: Date.now()
        }
      }
    })
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
}
module.exports = {UserService: new UserService()}