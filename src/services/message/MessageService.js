const MessageModel = require("./MessageModel");
const {httpError} = require("../../utils/HttpError");
const ConversationModel = require("../conversation/ConversationModel");
const UserModel = require("../user/UserModel");
const {ObjectId} = require('mongoose').Types;


class MessageService {
  async seenMessages(userId, conversationId, messageIds) {
    const conversation = await ConversationModel.findOne({
      _id: conversationId
    }).lean();

    if (!conversation) {
      throw httpError.badRequest('Conversation does not exist');
    }

    if (!conversation.participants.map(id => id.toString()).includes(userId)) {
      throw httpError.badRequest(`Current user does not in this conversation`);
    }

    const seenMessages = await MessageModel.find({_id: messageIds, from: {$ne: userId}}, {
      conversationId: 1,
    }).populate([
      {path: 'conversationId', select: 'participants'}
    ]).lean();

    if (seenMessages.some(message => message.conversationId._id.toString() !== conversationId)) {
      throw httpError.badRequest('Some messages are not in this conversation');
    }

    await MessageModel.updateMany({
      _id: {$in: messageIds},
      from: {$ne: userId}
    }, {
      $push: {
        seen: new ObjectId(userId)
      }
    });

    const unseenInCurrent = await MessageModel.countDocuments({
      conversationId,
      seen: {
        $not: {
          $elemMatch: {$eq: userId}
        }
      },
      from: {$ne: userId}
    });

    return unseenInCurrent;
  }

  async countUnseenMessages(userId) {
    const user = await UserModel.findOne({_id: userId}).lean();
    const conversationIds = user.friends.map(f => f.conversationId);

    const count = await MessageModel.countDocuments({
      conversationId: {$in: conversationIds.map(id => id.toString())},
      from: {$ne: userId},
      seen: {
        $not: {
          $elemMatch: {$eq: userId}
        }
      }
    });

    return count;
  }
}

module.exports = {MessageService: new MessageService()}