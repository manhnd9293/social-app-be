const {Schema, model} = require('mongoose');
const {AccountState, OnlineState} = require("../../utils/Constant");

let friendSchema = new Schema({
    friendId: {type: Schema.Types.ObjectId, ref: 'User'},
    conversationId: {type: Schema.Types.ObjectId, ref: 'Conversation'},
    date: {type: Date, default: Date.now}
});

const educationSchema = new Schema({
  show: {type: Boolean, default: true},
  name: {type: String, maxLength: 100},
  level: {type: String},
  from: {type: String},
  to: {type: String}
})

const relationshipSchema = new Schema({
  show: {type: Boolean, default: true},
  state: {type: String}
})

const homeTownSchema = new Schema({
  show: {type: Boolean},
  name: {type: String}
})

const PlaceSchema = new Schema({
  show: {type: Boolean},
  name: {type: String}
})

const dobSchema = new Schema({
  show: {type: Boolean},
  date: {type: Date}
})

const workSchema = new Schema({
  show: {type: Boolean},
  company: {type: String, maxLength: 50},
  position: {type: String, maxLength: 50},
  city: {type: String, maxLength: 10},
  description: {type: String, maxLength: 300},
  fromYear: {type: Number},
  toYear: {type: Number},
  isPresent: {type: Boolean},
})

const userSchema = new Schema({
  username: {type: String, required: true, maxLength: 10, minLength: 3},
  password: {type: String, required: true},
  fullName: {type: String, required: true, maxLength: 50, minLength: 1},
  avatar: {type:String},
  state: {type: String, default: AccountState.Pending},
  onlineState: {type: String, default: OnlineState.Offline},
  friends: [friendSchema],

  dob: {type: dobSchema},
  bio: {type: String, maxLength: 101},
  relationship: {type: relationshipSchema},
  educations: {type: [educationSchema]},
  hometown: {type: homeTownSchema},
  currentPlace: {type: PlaceSchema},
  works: {type: [workSchema]}
})

const UserModel = model('User', userSchema);

module.exports = UserModel;