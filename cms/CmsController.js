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
