var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
const { Validator } = require('node-input-validator');
var VerifyToken = require(__root + 'auth/VerifyToken');
//var Posts = require(__root + 'posts/PostsSchema');
//var config = require('../config'); // get config file
