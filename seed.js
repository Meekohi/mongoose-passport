var bcrypt = require('bcrypt');

// Mongoose
var mongoose = require('mongoose');
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/mdeval';
mongoUri = mongoUri + "?safe=true";
mongoose.connect(mongoUri);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

// Models
var User = require("./models/user.js");

users = [
	{
		firstName: "Michael",
		lastName: "Holroyd",
		isAdmin: true,
		email: "meekohi@gmail.com",
		auth : {
			username:"meekohi",
			encryptedPassword:"plaintextPassword"
		}
	}
];

db.once('open', function() {
	User.remove({},function(err){ // Empty the user collection (optional)
		if(err) console.log(err);
		users.forEach(function(user){
			user.auth.encryptedPassword = bcrypt.hashSync(user.auth.encryptedPassword,8);
			console.log(user);
			User.create(user,function(err, u) {
				if(err) console.log(err.err);
			});
		});
	});
});