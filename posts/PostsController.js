var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
const { Validator } = require('node-input-validator');
var VerifyToken = require(__root + 'auth/VerifyToken');
var Posts = require(__root + 'posts/PostsSchema');
var PostsCategoryRelation = require(__root + 'posts/PostsCategoryRelationSchema');
var Category = require(__root + 'category/CategorySchema');
var User = require(__root + 'user/UserSchema');

var config = require('../config'); // get config file

/*Parse body data to json format*/
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// RETURNS ALL THE Posts IN THE DATABASE
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
	.populate('author')
	.exec(function(err, posts) {
        if (err) return res.status(500).send({error : "There was a problem finding the list."});
        res.status(200).send({limit:limit, total_records:totalPosts, total_pages:totalPages, current_page:paged, data:posts});
    });
});

//http://localhost:3001/api/v1/cms/POST-TYPE/PAGINATION-NUMBER/POST-STATUS/
//http://localhost:3001/api/v1/cms/page/1/publish/
//http://localhost:3001/api/v1/cms/post/1/draft/
router.get('/:posttype?/:paged?/:withstatus?', VerifyToken, async function (req, res, next) {
	var posttype = (req.params.posttype) ? req.params.posttype : 'post';
	var paged = parseInt(req.params.paged);
	if(!paged)paged=1;
	var limit = (req.limit) ? req.limit : 10;
	var query = { "$and": [{post_type:posttype}] };
	var withstatus = (req.params.withstatus) ? req.params.withstatus : '';
	if(withstatus == 'all'){
		//console.log(withstatus);
	}else if(withstatus != ''){
		query["$and"][0].post_status = withstatus;
	}
	var totalPosts = await Posts.find(query).count({});
	var totalPages = (Math.ceil(totalPosts/limit));
	var skipPosts = (paged-1) * limit;
	
	var queryvar = [
	   { $match: query },
	   //{$group: {_id:"$idvar", total_st: {$sum:"$amountvar"}, max_age:{$max:"$age"} } },
	   //{ $unwind: {path: "$category",includeArrayIndex: "postcategory_index"} },	   
	   { $lookup: {
			from: 'postscategoryrelations',
			foreignField: 'post',
			localField: '_id',
			as: 'postcategory'			
	   }},
	   { $sort : { date: -1, title: 1 } },
	   { $skip: skipPosts },
	   { $limit: limit },
	   { $project: { __v: 0, "postcategory.__v":0, "postcategory._id":0, "postcategory.post":0, password:0, template:0 } },	   
	   //{$unwind: "$postcategory"}
	];
	
	Posts.aggregate(queryvar)
	.exec(async function(err, posts) {
		console.log(posts.length);
		if (err) return res.status(500).send({error : "There was a problem finding the list."});
        await Category.populate(posts, {path: "postcategory.category author",  select:  {__v: 0, date:0, updated_date:0, password:0} });
		res.status(200).send({limit:limit, total_records:totalPosts, total_pages:totalPages, current_page:paged, data:posts});
    });
		
	
	/*Posts.find(query)
	.limit(limit)
	.skip((paged-1) * limit)
	.populate('author')
	.then((posts) => {
		return res.status(200).send({limit:limit, total_records:totalPosts, total_pages:totalPages, current_page:paged, data:posts});
	})
	.catch((error) => {
		return res.status(500).send({error : "There was a problem finding the list."});
	});*/
	
	/*.exec(function(err, posts) {
        if (err) return res.status(500).send({error : "There was a problem finding the list."});
        
		res.status(200).send({limit:limit, total_records:totalPosts, total_pages:totalPages, current_page:paged, data:posts});
    });*/
	
	/*Posts.aggregate( [
	   {
		 $lookup:
		   {
			 from: "PostsCategoryRelation",
			 localField: "_id",
			 foreignField: "post",
			 as: "related_category"
		   }
	  }
	] )
	.exec(function(err, posts) {
        if (err) return res.status(500).send({error : "There was a problem finding the list."});
        
		res.status(200).send({limit:limit, total_records:totalPosts, total_pages:totalPages, current_page:paged, data:posts});
    });*/
	
});


// GETS A SINGLE USER FROM THE DATABASE
router.get('/:slug', VerifyToken, async function (req, res, next) {
	var slug = req.params.slug;
	//var query = {$and:[{post_type : 'post'},{post_status : 'publish'},{slug : slug}]};
	var query = {slug : slug};
	/*Posts.findOne(query)
	.populate('author')
	.exec(function(err, post) {
		if (err) return res.status(500).send({error : "There was a problem finding the list."});
		res.status(200).send(post);		
    });*/
	projectQuery = { $project : { __v:0, template:0, "postcategory._id":0, "postcategory.post":0, "postcategory.__v":0, "author.password":0 } };
	whereCondition = { $match: {"slug":slug} };
	//addNewFieldAlience = { $addFields: { pid: "$_id" }};
	//addNewFieldAlience = { $addFields: { postid: { $toObjectId: "$_id" }}};
	sortQuery = { $sort: { "date": -1 } };
	limitQuery = { $limit: 1 };
	skipQuery = { $skip: 10 };
	joinQuery = {
		$lookup: {
                    from: 'postscategoryrelations',
                    foreignField: 'post',
                    localField: '_id',
                    as: 'postcategory'
                }
				
		};
	
	Posts.aggregate( [
		whereCondition,
		joinQuery,		
		limitQuery,		
		sortQuery,		
		projectQuery,
	] )
	.exec(async function(err, post) {
		if (err) return res.status(500).send({error : "There was a problem finding the list."});
		await Category.populate(post, {path: "postcategory.category author",  select:  {__v: 0, date:0, updated_date:0}});
		res.status(200).send(post);	
		
		
    });
	
	
});

// CREATES A NEW USER
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
				author : req.body.author,
				meta_title : req.body.meta_title,
				meta_description : req.body.meta_description,
				meta_key : req.body.meta_key,
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
					if(req.body.category){
						PostsCategoryRelation.create({
							category : req.body.category,
							post : post._id
						},
						function (caterr, category) {
							if (caterr){
								console.log(caterr);
								//return res.status(500).send({error : "There was a problem to insert new list."});
							}else{
								//res.status(200).send(post);
							}
						});
					}
					res.status(200).send(post);
				}
			});
			
		}catch(err){
			return res.status(500).send({error:err});
		}			
		
	});
		
});

// DELETES A USER FROM THE DATABASE
router.delete('/:id', VerifyToken, function (req, res, next) {
    Posts.findByIdAndRemove(req.params.id, function (err, post) {
        if (err) return res.status(500).send({error : "There was a problem deleting the list data."});
        if(!post) return res.status(404).send({error : "Wrong list id."});
		let post_id = post._id;
		PostsCategoryRelation.deleteMany({ post: post_id }, function(error) {
			if (error) return res.status(500).send({error : "There was a problem deleting the list data relation."});
			res.status(200).send({message : post.post_type +" list : "+ post.title +" was deleted."});
		});
		
    });
});

// UPDATES A SINGLE USER IN THE DATABASE
// Added VerifyToken middleware to make sure only an authenticated user can put to this route

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
			
			const postCategory = req.body.category;
			delete req.body.category;
			Posts.findByIdAndUpdate(postID, req.body, {new: true, runValidators: true}, function (err, post) {
				if(err)return res.status(500).send({error : "There was a problem updating the list."});
				var postCategoryArray = [];
				if(postCategory){
					var index = postCategory.indexOf(',');
					if(index === -1){
						postCategoryArray = [postCategory]						
					}else{
						postCategoryArray = postCategory.split(',');						
					}
					
					let post_id = post._id;
					try {
						PostsCategoryRelation.deleteMany({ post: post_id }, function(err) {
							//console.log(err); //delete all previous category post data.
						});
						/*
						PostsCategoryRelation.create({
							category : postCategory,
							post : post._id
						}
						*/
						var PostsCategoryRelationArray = [];
						if(postCategoryArray.length > 0){
							for(i=0; i<postCategoryArray.length; i++){
								var categoryId = postCategoryArray[i];
								PostsCategoryRelationArray[i] = {category : categoryId,post : post._id};
							}
							
							console.log(PostsCategoryRelationArray);
							PostsCategoryRelation.insertMany( PostsCategoryRelationArray,
							function (caterr, category) {
								if (caterr){
									return res.status(500).send({error : "There was a problem to insert list category."});
								}else{
									return res.status(200).send(post);
								}
							});
						}
					} catch (e) {
					   //print (e);
					}
				}else{
					return res.status(200).send(post);
				}
				
			});
		}catch(err){
			return res.status(500).send({error:err});
		}
		
	});
});

module.exports = router;