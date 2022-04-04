var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
const { Validator } = require('node-input-validator');

var VerifyToken = require(__root + 'auth/VerifyToken');

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

var User = require(__root + 'user/UserSchema');

/**
 * Configure JWT
 */
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var bcrypt = require('bcryptjs');
var config = require('../config'); // get config file

router.post('/login', function(req, res) {
	const v = new Validator(req.body, {
		email: 'required|email',
		password: 'required|minLength:5'
	});
	
	v.check().then(async function (matched) {
		if(!matched) return res.status(422).send({auth: false, token: null, error :v.errors});
		
		try{
			User.findOne({ email: req.body.email }, function (err, user) {
			if (err) return res.status(500).send({auth: false, token: null, error : 'Error on the server.'});
			if (!user) return res.status(404).send({auth: false, token: null, error : 'No user found.'});
			
			// check if the password is valid
			var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
			if (!passwordIsValid) return res.status(401).send({ auth: false, token: null, error :'Wrong password.'});

			// if user is found and password is valid
			// create a token
			var token = jwt.sign({ id: user._id }, config.secret, {
			  expiresIn: 86400 // expires in 24 hours
			});

			// return the information including token as JSON
			res.status(200).send({ auth: true, token: token, error :'' });
		  });
		}catch(err){
			return res.status(500).send({error:err});
		}
	});
	
	

});

router.get('/logout', function(req, res) {
  res.status(200).send({ auth: false, token: null });
});

router.post('/register', function(req, res) {
	const v = new Validator(req.body, {
		name: 'required|minLength:5',
		email: 'required|email',
		password: 'required|minLength:5'
	});
	
	v.check().then(async function (matched) {
		if(!matched) return res.status(422).send({error :v.errors});
		
		try{
			const isUserExists = await User.findOne({ email: req.body.email }).count({});
			if(isUserExists>0) return res.status(500).send({error : "User with email already exists."});
			
			var hashedPassword = bcrypt.hashSync(req.body.password, 8);
			User.create({
				name : req.body.name,
				email : req.body.email,
				password : hashedPassword
			}, 
			function (err, user) {
				if (err){
					return res.status(500).send({error : "There was a problem registering the user."});
				}else{
					// if user is registered without errors
					// create a token
					var token = jwt.sign({ id: user._id }, config.secret, {
					  expiresIn: 86400 // expires in 24 hours
					});

					res.status(200).send({ auth: true, token: token });
				}
			});
			
		}catch(err){
			return res.status(500).send({error:err});
		}			
		
	});
});

router.get('/myprofile', VerifyToken, function(req, res, next) {
console.log(req.userId);
  User.findById(req.userId, { password: 0 }, function (err, user) {
    if (err) return res.status(500).send({error:"There was a problem finding the user."});
    if (!user) return res.status(404).send({error:"No user found."});
    res.status(200).send(user);
  });

});

module.exports = router;