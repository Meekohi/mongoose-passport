// User Model
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var userSchema = new Schema({
	firstName: {type:'string', trim:true},
	lastName: {type:'string', trim:true},
	email: { type:'string', lowercase:true, trim:true, unique:true },
	isAdmin: { "type": Boolean, "default": false },
	auth: {
		facebook_id: 'string',
		twitter_id: 'string',
		google_id: 'string',
		username: { type:'string', lowercase:true, trim:true, unique:true },
		encryptedPassword: 'string'
	},
});

module.exports = mongoose.model('User', userSchema);