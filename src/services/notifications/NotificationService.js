const {NotificationModel} = require("./NotificationModel");
const socketClient = require("../../config/socketClient");
const UserModel = require("../user/UserModel");
const {httpError} = require("../../utils/HttpError");

class NotificationService {
  async notify({from, to, payload, type}) {
    if (from.toString() === to.toString()) {
      return;
    }
    const check = await NotificationModel.findOne({
      from, to, type, seen: false, 'payload.media': payload?.media, 'payload.mediaId': payload?.mediaId
    }).lean();
    if (check) {
      return;
    }

    await NotificationModel.create({
      from, to, payload, type
    });

    const fromUser = await UserModel.findOne({_id: from}, {fullName: 1, avatar: 1}).lean();
    const unseen = await NotificationModel.countDocuments({to, seen: false});

    await socketClient.post('/socket-notification',{from: fromUser, to: to.toString(), payload, type, unseen} , {
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

  async updateSeen(userId, notificationIds) {
    const notifications = await NotificationModel.find({
      _id: notificationIds
    }, {to: 1}).lean();
    if (notifications.some(notification => notification.to.toString() !== userId)) {
      throw httpError.badRequest('User can not update some notifications');
    }
    await NotificationModel.updateMany({
      _id: {$in: notificationIds},
      to: userId,
    }, {
      $set: {seen: true}
    });
  }

  async countUnseenNotification(userId) {
    const count = await NotificationModel.countDocuments({
      to: userId,
      seen: false
    });

    return count;
  }
}

module.exports = {NotificationService: new NotificationService()}