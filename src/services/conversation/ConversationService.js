const UserModel = require("../user/UserModel");
const ConversationModel = require("./ConversationModel");
const {httpError} = require("../../utils/HttpError");
const MessageModel = require("../message/MessageModel");

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
    ).lean()
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

    let messages = MessageModel.find({
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
    }).skip(offset || 0);

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