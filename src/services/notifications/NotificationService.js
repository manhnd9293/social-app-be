const {NotificationModel} = require("./NotificationModel");
const socketClient = require("../../config/socketClient");
const UserModel = require("../user/UserModel");

class NotificationService {
  async notify({from, to, payload, type}) {
    if (from.toString() === to.toString()) {
      return;
    }
    const check = await NotificationModel.findOne({
      from, to, type, seen: false, 'payload.media': payload.media, 'payload.mediaId': payload.mediaId
    }).lean();
    if (check) {
      return;
    }

    await NotificationModel.create({
      from, to, payload, type
    });

    const fromUser = await UserModel.findOne({_id: from}, {fullName: 1, avatar: 1}).lean();

    await socketClient.post('/socket-notification',{from: fromUser, to: to.toString(), payload, type} , {
      headers: {
        'x-access-token': process.env.SOCKET_TOKEN
      }
    })
  }

  async getNotifications(userId, page, offset = 0) {
    const data = await NotificationModel.find({
      to: userId
    }).populate({
      path: 'from',
      select: {fullName: 1,avatar: 1}
    }).sort({seen: 1, _id: -1}).skip(page * 10 + offset).limit(10);

    return data;
  }

  async updateSeen(notificationIds) {
    await NotificationModel.updateMany({
      _id: {$in: notificationIds}
    }, {
      $set: {seen: true}
    })
  }
}

module.exports = {NotificationService: new NotificationService()}