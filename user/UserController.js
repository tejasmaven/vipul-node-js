var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
const { Validator } = require('node-input-validator');
var VerifyToken = require(__root + 'auth/VerifyToken');
var User = require(__root + 'user/UserSchema');
var bcrypt = require('bcryptjs');
var config = require('../config'); // get config file
const multer = require('multer'); //for image upload
const fs = require('fs');

/*Parse body data to json format*/
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());


var storage = multer.diskStorage({
   destination: function (req, file, cb) {	   
      //cb(null, 'uploads');
	  cb(null, 'public/uploads');
	  
   },
   filename: function (req, file, cb) {	   
      cb(null, Date.now() + '-' + file.originalname);
   }
});
var upload = multer({ storage: storage });


// RETURNS ALL THE USERS IN THE DATABASE
router.get('/', function (req, res) {
//router.get('/', VerifyToken, function (req, res, next) {
    User.find({}, { password: 0 }, function (err, users) {
        if (err) return res.status(500).send({error : "There was a problem finding the users."});
        res.status(200).send(users);
    });
});

// Search THE USERS IN THE DATABASE
//router.get('/search/:keyword', function (req, res) {
router.get('/search/:keyword?', VerifyToken, function (req, res, next) {
	var query = {};
	if(req.params.keyword){
		let keyword = new RegExp(req.params.keyword,'i');
		query = {$or:[{name: keyword},{email:keyword}]}; //db.users.find({"name": /.*m.*/})
		
	}
	User.find(query, { password: 0 }, function (err, users) {
        if (err) return res.status(500).send({error : "There was a problem finding the users."});
        res.status(200).send(users);
    });
});

// GETS A SINGLE USER FROM THE DATABASE
//router.get('/:id', function (req, res) {
router.get('/:id', VerifyToken, function (req, res, next) {
	User.findById(req.params.id, {password:0}, function (err, user) {
        if (err) return res.status(500).send({error : "There was a problem finding the user."});
        if (!user) return res.status(404).send({error : "No user found."});
        res.status(200).send(user);
    });
});

// CREATES A NEW USER
//router.post('/', function (req, res) {
router.post('/', VerifyToken, function(req, res, next) {
	console.log(req.body);
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
					
					res.status(200).send(user);
				}
			});
			
		}catch(err){
			return res.status(500).send({error:err});
		}			
		
	});
		
});

// DELETES A USER FROM THE DATABASE
//router.delete('/:id', function (req, res) {
router.delete('/:id', VerifyToken, function (req, res, next) {
    User.findByIdAndRemove(req.params.id, function (err, user) {
        if (err) return res.status(500).send({error : "There was a problem deleting the user."});
        if(!user) return res.status(404).send({error : "Wrong user id."});
		res.status(200).send({message : "User: "+ user.name +" was deleted."});
    });
});

// UPDATES A SINGLE USER IN THE DATABASE
// Added VerifyToken middleware to make sure only an authenticated user can put to this route
//router.put('/:id', function (req, res) {
router.put('/:id', VerifyToken, function (req, res, next) {
	var userID = req.params.id;
	if(req.body.name || req.body.email || req.body.password){
		
	}else{
		return res.status(422).send({error :'cannot send blank data.'});
	}
	
	var validatorVar = {};
	if(req.body.name) validatorVar.name = 'required|minLength:5';
	if(req.body.email) validatorVar.email = 'required|email';
	if(req.body.password) validatorVar.password = 'required|minLength:5';
	
	const v = new Validator(req.body, validatorVar);
	v.check().then(async function (matched) {			
		if(!matched) return res.status(422).send({error :v.errors});
		try{
			if(req.body.email){
				const isUserExists = await User.findOne({ email: req.body.email,_id: { $ne: userID } }).count({});
				if(isUserExists>0) return res.status(500).send({error : "User with email already exists."});
			}
			if(req.body.password) req.body.password = bcrypt.hashSync(req.body.password, 8);			
			
			User.findByIdAndUpdate(userID, req.body, {new: true}, function (err, user) {
				if (err) return res.status(500).send({error : "There was a problem updating the user."});
				res.status(200).send(user);
			});
		}catch(err){
			return res.status(500).send({error:err});
		}
		
	});
});


router.post('/photo-upload/:id', upload.single('photo'),(req, res) => {
	const image = req.file;  
	if(image.fieldname == 'photo'){
		//var thefile = req.file.destination+'/'+req.file.filename;
		var thefile = req.file.filename;
		var userID = req.params.id;
		var userOldPhoto = '';
		try{
			User.findById(userID, {password:0}, function (err, user) {
				if(user && user.photo){
					var substring = 'public/';
					var userPhoto = user.photo;
					if(userPhoto.includes(substring)){
						userOldPhoto = user.photo;
					}else{
						userOldPhoto = req.file.destination+'/'+user.photo;
					}				
				}
			});
			
			User.findByIdAndUpdate(userID, {'photo':thefile}, {new: true}, function (err, user) {
				if (err) return res.status(500).send({error : "There was a problem updating the user."});
				//if(userOldPhoto)console.log('OLD photo : '+userOldPhoto);
				try{
					fs.unlinkSync(userOldPhoto);
				}catch(err){
					return res.status(500).send({error:err});
				}
				res.status(200).send(user);
			});
		}catch(err){
			return res.status(500).send({error:err});
		}		
	}
});

module.exports = router;