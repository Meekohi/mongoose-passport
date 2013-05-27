var http = require('http');
var https = require('https');
var fs = require('fs');
var flash = require('connect-flash');
var express = require('express');
var mustache = require('mustache');
var bcrypt = require('bcrypt');

// Mongoose
var mongoose = require('mongoose');
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/mongoose_passport';
mongoUri = mongoUri + "?safe=true";
mongoose.connect(mongoUri);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

// Passport
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({$or:[{ "auth.username": username },{ "email":username }]}, function (err, user) {
      console.log(user);
      if (err) {
        console.log(err);
        return done(err);
      }
      if (!user) {
        console.log("Incorrect username.");
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!bcrypt.compareSync(password, user.auth.encryptedPassword)) {
        console.log("Invalid password.");
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));
passport.serializeUser(function(user, done) {
  done(null, user._id);
});
passport.deserializeUser(function(_id, done) {
  User.findById(_id, function(err, user) {
    done(err, user);
  });
});

// Models
var User = require("./models/user.js");

var logIfDbError = function(e)
{
  if(e)
  {
    console.log(e);
  }
};

var authenticate = function(req, res, next) {
  if(req.url == "/login" || req.url == "/password")
    next();
  else if(!req.user)
    res.redirect("/login");
  else
  {
    passport.deserializeUser(req.user._id, function(err,user){
      if(user)
        next();
      else
        res.redirect("/login");
    });
  }
};

// Setup the Mustache templates
var mustacheIndex = mustache.compile(fs.readFileSync("index.html",'utf8'));
var mustacheLogin = mustache.compile(fs.readFileSync("login.html",'utf8'));
var mustachePasswordReset = mustache.compile(fs.readFileSync("passwordReset.html",'utf8'));

db.once('open', function() {

  var app = express();
  var port = process.env.PORT || 5000;
  var sslport = process.env.PORT || 5433;

  app.configure(function() {
    app.use(express.logger());
    app.use(express.static('public'));
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.session({ secret: 'llama waffle windy kelp' }));
    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(authenticate);
    app.use(app.router);
  });

  http.createServer(app).listen(port);

  /*
  var ssl_options = {
    key: fs.readFileSync('./ssl/server.key'),
    cert: fs.readFileSync('./ssl/server.crt'),
  };
  https.createServer(ssl_options, app).listen(sslport);
  */

  // Routes:

  // Login
  app.get('/login', function(req, response) {
    response.send(mustacheLogin({flash: req.flash('error') }));
  });
  app.post('/login',
    passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/login',
      failureFlash: true
    })
  );

  app.get('/password', function(req, response) {
    response.send(mustachePasswordReset({flash: req.flash('error') }));
  });
  app.post('/password', function(req, response, next) {
    passport.authenticate('local', function(err, user, info) {
      if (err) {
        console.log(err);
        return next(err);
      }
      if (!user) {
        req.flash("Incorrect password");
        return response.redirect('/login');
      }
      if ( req.body.newpassword[0] != req.body.newpassword[1]) {
        req.flash('error',"Passwords did not match");
        return response.redirect('/password');
      }
      req.logIn(user, function(err) {
        if (err) {
          console.log(err);
          return next(err);
        }
        user.auth.encryptedPassword = bcrypt.hashSync(req.body.newpassword[0],8);
        user.save(function(err){
          if(err)
          {
            console.log(err);
            req.flash('error',"Could not reset password.");
            return response.redirect('/password');
          }
          else
          {
            req.flash('info',"Your password has been reset");
            return response.redirect('/');
          }
        });
      });
    })(req, response, next);
  });

  app.get('/', function(req, response) {
    response.send(mustacheIndex({user: req.user}));
  });

});
