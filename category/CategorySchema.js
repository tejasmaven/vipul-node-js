const mongoose = require('mongoose');
const { Schema } = mongoose;

//add database table details (schema)
const categoryScheme = new mongoose.Schema({
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
	content: {
		type: String
	},
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
	type: {
		type: String,
		required: true,
		default: 'category'
	},
	status: {
		type: String,
		default: 'publish'		
	},
	photo: {
		type: String	
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

module.exports = mongoose.model('Category',categoryScheme);
