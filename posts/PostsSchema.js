const mongoose = require('mongoose');
const { Schema } = mongoose;

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
		unique: true,
		min: 1,
		max: 255
	},
	excerpt: {
		type: String		
	},
	content: {
		type: String
	},
	/*category: { type: Schema.Types.ObjectId, ref: 'Category' },*/
	author: { type: Schema.Types.ObjectId, ref: 'User' },
	meta_title: {
		type: String
	},
	meta_description: {
		type: String
	},
	meta_key: {
		type: String
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
	updated_date: {
		type: Date,
		default: Date.now
	},	
	date: {
		type: Date,
		default: Date.now
	}
});

module.exports = mongoose.model('Post',postsScheme);
