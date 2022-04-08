var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
const { Validator } = require('node-input-validator');
var VerifyToken = require(__root + 'auth/VerifyToken');
var Posts = require(__root + 'cms/cmsSchema');
var config = require('../config'); // get config file

/*Parse body data to json format*/
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// RETURNS ALL THE Posts IN THE DATABASE
//router.get('/pages', function (req, res) {
router.get('/pages/:paged?', VerifyToken, async function (req, res, next) {
	var paged = parseInt(req.params.paged);
	if(!paged)paged=1;
	var limit = (req.limit) ? req.limit : 10;
	
	var query = {post_type:'page'};
	var totalPosts = await Posts.find(query).count({});
	var totalPages = (Math.ceil(totalPosts/limit));
	Posts.find(query)
	.limit(limit)
	.skip((paged-1) * limit)
	.exec(function(err, posts) {
        if (err) return res.status(500).send({error : "There was a problem finding the list."});
        res.status(200).send({limit:limit, total_records:totalPosts, total_pages:totalPages, current_page:paged, data:posts});
    });
});

//router.get('/posts', function (req, res) {
router.get('/posts/:paged?', VerifyToken, async function (req, res, next) {
	var paged = parseInt(req.params.paged);
	if(!paged)paged=1;
	var limit = (req.limit) ? req.limit : 10;
	var query = {post_type:'post'};
	var totalPosts = await Posts.find(query).count({});
	var totalPages = (Math.ceil(totalPosts/limit));
	
	Posts.find(query)
	.limit(limit)
	.skip((paged-1) * limit)
	.exec(function(err, posts) {
        if (err) return res.status(500).send({error : "There was a problem finding the list."});
        res.status(200).send({limit:limit, total_records:totalPosts, total_pages:totalPages, current_page:paged, data:posts});
    });
});


// GETS A SINGLE USER FROM THE DATABASE
//router.get('/:slug', function (req, res) {
router.get('/:slug', VerifyToken, function (req, res, next) {
	var slug = req.params.slug;
	var query = {$and:[{post_type : 'post'},{slug : slug}]};
	Posts.findOne(query)
	.exec(function(err, post) {
        if (err) return res.status(500).send({error : "There was a problem finding the list."});
        res.status(200).send({post});
    });	
});

// CREATES A NEW USER
//router.post('/', function (req, res) {
router.post('/', VerifyToken, function(req, res, next) {
	var dataValidator = {
		title: 'required|minLength:2',
		slug: 'required|minLength:2'		
	};	
    const v = new Validator(req.body, dataValidator);
	
	v.check().then(async function (matched) {
		if(!matched) return res.status(422).send({error :v.errors});
		
		try{
			req.body.author = (req.body.author) ? req.body.author : req.userId;
			
			req.body.slug = (req.body.slug) ? req.body.slug : req.body.title;
			var slug = (req.body.slug).toLowerCase();
			req.body.slug = slug.replace(/[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/? ]+/g,"-");
			
			if(req.body.slug){
				const isSlugExists = await Posts.findOne({ slug: req.body.slug }).count({});
				if(isSlugExists>0) return res.status(500).send({error : "Unique slug already there please try new one."});
			}
			
			Posts.create({
				title : req.body.title,
				slug : req.body.slug,
				excerpt : req.body.excerpt,
				content : req.body.content,
				category : req.body.category,
				author : req.body.author,
				post_type : req.body.post_type,
				post_status : req.body.post_status,
				photo : req.body.photo,
				template : req.body.template,
				password : req.body.password
			}, 
			function (err, post) {
				if (err){
					console.log(err);
					return res.status(500).send({error : "There was a problem to insert new list."});
				}else{
					
					res.status(200).send(post);
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
    Posts.findByIdAndRemove(req.params.id, function (err, post) {
        if (err) return res.status(500).send({error : "There was a problem deleting the list data."});
        if(!post) return res.status(404).send({error : "Wrong list id."});
		res.status(200).send({message : post.post_type +" list : "+ post.title +" was deleted."});
    });
});

// UPDATES A SINGLE USER IN THE DATABASE
// Added VerifyToken middleware to make sure only an authenticated user can put to this route
//router.put('/:id', function (req, res) {
router.put('/:id', VerifyToken, function (req, res, next) {
	var postID = req.params.id;
	
	var validatorVar = {};
	if(req.body.title) validatorVar.title = 'required|minLength:2';
	if(req.body.slug) validatorVar.slug = 'required|minLength:2';
	
	const v = new Validator(req.body, validatorVar);
	v.check().then(async function (matched) {			
		if(!matched) return res.status(422).send({error :v.errors});
		try{
			if(req.body.slug){
				var slug = (req.body.slug).toLowerCase();
				req.body.slug = slug.replace(/[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/? ]+/g,"-");
				
				const isSlugExists = await Posts.findOne({ slug: req.body.slug,_id: { $ne: postID } }).count({});
				if(isSlugExists>0) return res.status(500).send({error : "Unique slug already there please try new one."});
			}
			
			Posts.findByIdAndUpdate(postID, req.body, {new: true}, function (err, post) {
				if (err) return res.status(500).send({error : "There was a problem updating the list."});
				res.status(200).send(post);
			});
		}catch(err){
			return res.status(500).send({error:err});
		}
		
	});
});

module.exports = router;