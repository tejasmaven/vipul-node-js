var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
const { Validator } = require('node-input-validator');
var VerifyToken = require(__root + 'auth/VerifyToken');
var Category = require(__root + 'category/CategorySchema');
var Posts = require(__root + 'posts/PostsSchema');
var PostsCategoryRelation = require(__root + 'posts/PostsCategoryRelationSchema');
var User = require(__root + 'user/UserSchema');

var config = require('../config'); // get config file

/*Parse body data to json format*/
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// RETURNS ALL THE IN THE DATABASE
//http://localhost:3001/api/v1/category/list/CATEGORY_TYPE/PAGINATION-NUMBER/RELAED-POST-STATUS/
//http://localhost:3001/api/v1/category/list/category/1/publish/
//Get Category by Slug with post list
//http://localhost:3001/api/v1/category/list/CATEGORY_TYPE/PAGINATION-NUMBER/RELAED-POST-STATUS/CATEGORY-SLUG
//http://localhost:3001/api/v1/category/list/category/1/publish/category-02
router.get('/list/:cattype/:paged?/:withstatus?/:slug?', VerifyToken, async function (req, res, next) {
	var cattype = req.params.cattype;
	var paged = parseInt(req.params.paged);
	var withstatus = req.params.withstatus ? req.params.withstatus : '';
	var slug = req.params.slug ? req.params.slug : '';
	
	if(!paged)paged=1;
	var limit = (req.limit) ? req.limit : 10;
	cattype = (req.params.cattype) ? req.params.cattype : 'category';
	var query = {type:cattype};
	if(slug){query.slug = slug;}
	
	var total = await Category.find(query).count({});
	var totalPages = (Math.ceil(total/limit));
	var skipPosts = (paged-1) * limit;
	
	var queryvar = [
	   { $match: query },
	   { $lookup: {
			from: 'postscategoryrelations',
			foreignField: 'category',
			localField: '_id',
			as: 'posts'			
	   }},
	   /*{$lookup:{
				from: "posts", 
				foreignField: 'post',
				localField: '$posts.post',
				as: "postdata"
		}},*/
		//{   $unwind:"$postdata" },
	
	
	   { $sort : { title: 1 } },
	   { $skip: skipPosts },
	   { $limit: limit },
	   { $project: { __v: 0, "posts.__v":0, "posts._id":0, "posts.category":0, password:0, template:0 } },	   
	   //{$unwind: "$postcategory"}
	];
	
	Category.aggregate(queryvar)
	.exec(async function(err, category_data) {
		if (err) return res.status(500).send({error : "There was a problem finding the list."});
		var postPopulatequery = {path: "posts.post", select:  {__v: 0, date:0, updated_date:0, password:0, category:0}};
		if(withstatus == 'all'){
			//console.log(query);
		}else if(withstatus != ''){
			postPopulatequery.match = { post_status: { $in: withstatus }, 'post': {'$ne': ''} };
		}
		
        await Posts.populate(category_data, postPopulatequery);
		await User.populate(category_data, {path: "posts.post.author",  select:  {__v: 0, date:0, updated_date:0, password:0} });
		if(slug){
			if(category_data && category_data[0]){
				return res.status(200).send(category_data[0]);
			}else{
				return res.status(404).send({error : "Cannot find category data."});
			}
		}else{
			return res.status(200).send({limit:limit, total_records:total, total_pages:totalPages, current_page:paged, data:category_data});
		}
		
    });
	
	/*Category.find(query)
	.limit(limit)
	.skip((paged-1) * limit)
	.populate('author')
	.exec(function(err, category_data) {
        if (err) return res.status(500).send({error : "There was a problem finding the list."});
        res.status(200).send({limit:limit, total_records:total, total_pages:totalPages, current_page:paged, data:category_data});
    });*/
});

// GETS A SINGLE FROM THE DATABASE
//http://localhost:3001/api/v1/category/category-02
router.get('/:slug', VerifyToken, function (req, res, next) {
	var slug = req.params.slug;
	var query = {slug : slug};
	Category.findOne(query)
	.populate('author')
	.exec(function(err, category_data) {
		if (err) return res.status(500).send({error : "There was a problem finding the list."});
		res.status(200).send(category_data);		
    });
	
	
});


// CREATES A NEW
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
				const isSlugExists = await Category.findOne({ slug: req.body.slug }).count({});
				if(isSlugExists>0) return res.status(500).send({error : "Unique slug already there please try new one."});
			}
			
			Category.create({
				title : req.body.title,
				slug : req.body.slug,
				content : req.body.content,
				author : req.body.author,
				meta_title : req.body.meta_title,
				meta_description : req.body.meta_description,
				meta_key : req.body.meta_key,
				type : req.body.type,
				status : req.body.status,
				photo : req.body.photo			
				
			}, 
			function (err, category_data) {
				
				if (err){
					console.log(err);
					return res.status(500).send({error : "There was a problem to insert new list."});
				}else{
					
					res.status(200).send(category_data);
				}
			});
			
		}catch(err){
			console.log('Cateogry error.');
			return res.status(500).send({error:err});
		}			
		
	});
		
});

// DELETES FROM THE DATABASE
router.delete('/:id', VerifyToken, function (req, res, next) {
	console.log(req.params.id);
    Category.findByIdAndRemove(req.params.id, function (err, category_data) {
        if (err) return res.status(500).send({error : "There was a problem deleting the list data."});
        if(!category_data) return res.status(404).send({error : "Wrong list id."});
		
		let category_id = req.params.id;
		PostsCategoryRelation.deleteMany({ category: category_id }, function(error) {
			if (error) return res.status(500).send({error : "There was a problem deleting the list data relation."});
			res.status(200).send({message : category_data.post_type +" list : "+ category_data.title +" was deleted."});
		});
		
		
    });
});

// UPDATES A SINGLE IN THE DATABASE
// Added VerifyToken middleware to make sure only an authenticated user can put to this route

router.put('/:id', VerifyToken, function (req, res, next) {
	var categoryID = req.params.id;
	console.log(categoryID);
	
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
				
				const isSlugExists = await Category.findOne({ slug: req.body.slug,_id: { $ne: categoryID } }).count({});
				if(isSlugExists>0) return res.status(500).send({error : "Unique slug already there please try new one."});
			}
			
			Category.findByIdAndUpdate(categoryID, req.body, {new: true}, function (err, post) {
				if (err) return res.status(500).send({error : "There was a problem updating the list."});
				res.status(200).send(post);
			});
		}catch(err){
			return res.status(500).send({error:err});
		}
		
	});
});

module.exports = router;