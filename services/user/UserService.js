const UserModel = require("./UserModel");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const { httpError} = require("../../utils/HttpError");
const {AccountState} = require("../../utils/Constant");


class UserService {
  async getUser(id, populate) {
    const defaultPopulate = {username: 1, fullName: 1}
    const user = await UserModel.findOne(
      {_id: id},
      {... defaultPopulate, ...populate})
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
      state: AccountState.Pending
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
}

module.exports = {UserService: new UserService()}