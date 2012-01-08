var crypto = require('crypto'),
    Document,
    User,
    LoginToken;

function defineModels(mongoose, fn) {
  var Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

  // Model: Transcription
  Transcription = new Schema({
    'title': {type: String, index: true},
    'album': {type: String, index: true},
    'artist': {type: String, index: true},
    'description': {type: String},
    'fileLocation': {type: String},
    'upVotes': {type: Number},
    'userId': {type: ObjectId, index: true}
  });

  Transcription.virtual('id')
    .get(function() {
      return this._id.toHexString();
  });

  /**
    * Model: User
    */
  function validatePresenceOf(value) {
    return value && value.length;
  }

  User = new Schema({
    'username': { type: String, validate: [validatePresenceOf, 'a username is required'], index: { unique: true } },
    'email': { type: String, validate: [validatePresenceOf, 'an email is required'], index: { unique: true } },
    //'profPicLoc': {type: String}, //index: { unique: true}},
    'karmaPoints': {type: Number},
    'personalWebsite': {type: String},
    'hashed_password': String,
    'salt': String
  });

  User.virtual('id')
    .get(function() {
      return this._id.toHexString();
    });

  User.virtual('password')
    .set(function(password) {
      this._password = password;
      this.salt = this.makeSalt();
      this.hashed_password = this.encryptPassword(password);
    })
    .get(function() { return this._password; });

  User.method('authenticate', function(plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  });

  User.method('makeSalt', function() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
  });

  User.method('encryptPassword', function(password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
  });

  User.pre('save', function(next) {
    if (!validatePresenceOf(this.password)) {
      next(new Error('Invalid password'));
    } else {
      next();
    }
  });

  /**
    * Model: LoginToken
    *
    * Used for session persistence.
    */
  LoginToken = new Schema({
    username: { type: String, index: true },
    series: { type: String, index: true },
    token: { type: String, index: true }
  });

  LoginToken.method('randomToken', function() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
  });

  LoginToken.pre('save', function(next) {
    // Automatically create the tokens
    this.token = this.randomToken();

    if (this.isNew)
      this.series = this.randomToken();

    next();
  });

  LoginToken.virtual('id')
    .get(function() {
      return this._id.toHexString();
    });

  LoginToken.virtual('cookieValue')
    .get(function() {
      return JSON.stringify({ username: this.username, token: this.token, series: this.series });
    });

  /**
    * Model: Bounty
    */

  Bounty = new Schema({
    'hasUploaded': {type: Boolean},
    'fulfilled': {type: Boolean},
    'transcriptionId': { type: String, index: { unique: true } },
    'numPoints': {type: Number},
    'title': {type: String, index: true},
    'album': {type: String, index: true},
    'artist': {type: String, index: true},
    'description': {type: String},
    'userId': {type: ObjectId, index: true, unique:true}
  });

  Bounty.virtual('id')
    .get(function() {
      return this._id.toHexString();
  });

  // Create models
  mongoose.model('Transcription', Transcription);
  mongoose.model('User', User);
  mongoose.model('LoginToken', LoginToken);
  mongoose.model('Bounty', Bounty);

  fn();
}


exports.defineModels = defineModels;
