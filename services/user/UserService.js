const UserModel = require("./UserModel");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const {aws} = require("../../config/aws/aws");


class UserService {
  async getUser(id) {
    const user = await UserModel.findOne({id}, {
      username: 1,
      fullName: 1,
    }).lean();

    return user;
  }
  async login(username, password) {
    const user = await UserModel.findOne({username});
    if (!user) {
      throw 'User not found';
    }

    const passwordIsValid = bcrypt.compareSync(
      password,
      user.password
    );
    if (!passwordIsValid) {
      throw 'Invalid username or password';
    }

    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET ,{
      expiresIn: process.env.JWT_EXPIRE
    })

    return {
      _id: user._id,
      accessToken: token,
      fullName: user.fullName,
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
    }).save()

    return {
      _id: user._id,
      accessToken: this.generateAccessToken(user._id),
      fullName,
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
}

module.exports = {UserService: new UserService()}