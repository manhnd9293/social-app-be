const UserModel = require("../user/UserModel");

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
        {path: 'friends.friendId', select: {fullName: 1, avatar: 1}},
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
}

module.exports = {ConversationService: new ConversationService()}