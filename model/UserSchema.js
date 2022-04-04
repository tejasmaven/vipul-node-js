const mongoose = require('mongoose');

//add database table details (schema)
const userScheme = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		min: 2,
		max: 255
	},
	email: {
		type: String,
		required: true,
		min: 2,
		max: 255
	},
	password: {
		type: String,
		required: true,
		min: 3,
		max: 1024
	}
	,
	date: {
		type: Date,
		default: Date.now
	}
});

//mongoose.model('User', UserSchema);
//module.exports = mongoose.model('User');

module.exports = mongoose.model('User',userScheme);