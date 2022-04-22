const mongoose = require('mongoose');
const { Schema } = mongoose;

//add database table details (schema)
const PostsCategoryRelationSchema = new mongoose.Schema({
	category: { type: Schema.Types.ObjectId, ref: 'Category' },
	post: { type: Schema.Types.ObjectId, ref: 'Post' }
});

module.exports = mongoose.model('postscategoryrelation',PostsCategoryRelationSchema);
