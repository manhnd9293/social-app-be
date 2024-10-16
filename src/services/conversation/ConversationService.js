const UserModel = require("../user/UserModel");
const ConversationModel = require("./ConversationModel");
const {httpError} = require("../../utils/HttpError");
const MessageModel = require("../message/MessageModel");
const {ObjectId} = require('mongoose').Types;

class ConversationService {

  async getConversationList(userId) {
    const conversationList = await UserModel.findOne(
      {
        _id: userId
      },
      {
        'friends.friendId': 1,
        'friends.conversationId': 1
      }
    ).populate(
      [
        {path: 'friends.friendId', select: {fullName: 1, avatar: 1, onlineState: 1}},
        {
          path: 'friends.conversationId',
          select: {
            id: 0
          },
          populate: {
            path: 'lastMessageId',
            select: {textContent: 1, date: 1, from: 1}
          }
        },
      ]
    ).lean();
    const conversationIds = conversationList.friends.map(friend => friend.conversationId._id);

    const aggregateUnreadMessage = await ConversationModel.aggregate([
      {
        $match: {
          _id: {$in: conversationIds}
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
                from: {$ne: new ObjectId(userId)}
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
                $eq: new ObjectId(userId)
              }
            }

          }
        }
      },
      {
        $group: {
          _id: '$_id',
          total: {$sum: 1}
        }
      }
    ]) ;
    const conversationIdToUnSeenMessage = new Map();
    aggregateUnreadMessage.forEach(result => conversationIdToUnSeenMessage.set(result._id.toString(), result.total))
    conversationList.friends.forEach(f => f.conversationId.unReadMessages = conversationIdToUnSeenMessage.get(f.conversationId._id.toString()) || 0);

    conversationList.friends.sort((a, b) => b.conversationId.lastMessageId.date - a.conversationId.lastMessageId.date);
    return conversationList;

  }

  async getMessages(userId, conversationId, offset, limit) {
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
    }).lean();

    if (!conversation.participants.map(id => id._id.toString()).includes(userId)) {
      throw httpError.unauthorize('Not allow to get message data of this conversation');
    }

    let messages = await MessageModel.find({
      conversationId
    }).populate([
      {
        path: 'from',
        select: {
          fullName: 1,
          avatar: 1
        }
      }]).sort({
      date: 1
    }).skip(offset || 0).lean();

    messages.forEach(m => {
      const seen = m.seen.map(id => id.toString()).includes(userId) ? true : false;
      m.seen = seen;
    })

    return messages

  }

  async getConversationDetail(userId, conversationId) {
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
    }).populate(
      {
        path: 'participants',
        select: {
          fullName: 1,
          avatar: 1,
          onlineState: 1
        }
      }
    ).lean();

    if (!conversation) {
      throw httpError.badRequest('Conversation not exist');

    }

    if (!conversation.participants.map(id => id._id.toString()).includes(userId)) {
      throw httpError.unauthorize('Not allow to get message data of this conversation');
    }

    return conversation;
  }
}

module.exports = {ConversationService: new ConversationService()}