const mongoose = require('mongoose');

//add database table details (schema)
const postsScheme = new mongoose.Schema({
	title: {
		type: String,
		required: true,
		min: 1,
		max: 255
	},
	slug: {
		type: String,
		required: true,
		min: 1,
		max: 255
	},
	excerpt: {
		type: String		
	},
	content: {
		type: String
	},
	category: {
		type: String
	},
	author: {
		type: String,
		required: true
	},
	post_type: {
		type: String,
		required: true,
		default: 'post'
	},
	post_status: {
		type: String,
		default: 'publish'		
	},
	photo: {
		type: String	
	},
	template: {
		type: String,
		default: ''
	},
	password: {
		type: String,
		default: ''
	},
	date: {
		type: Date,
		default: Date.now
	}
});

module.exports = mongoose.model('Posts',postsScheme);