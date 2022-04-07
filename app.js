const express = require('express');
const app = express();
const db = require('./db');
var http = require('http');
global.__root   = __dirname + '/';

//app.use(express.json()); //to solve json parse problem

app.use(express.static(global.__root+'public')); // allow public folder to access from outside
app.use(express.urlencoded({extended: true}));
app.use('/images',express.static(global.__root+'public/uploads'));
//http://localhost:3001/images/1649159920869-5576035.webp

app.get('/', function (req, res) {
  res.status(200).send('Main Page.');
});

app.get('/api/v1', function (req, res) {
  res.status(200).send('API works.');
});

/*Router*/
var UserController = require(__root + 'user/UserController');
app.use('/api/v1/users', UserController);

var AuthController = require(__root + 'auth/AuthController');
app.use('/api/v1/auth', AuthController);

//var PostsController = require(__root + 'cms/cmsController');
//app.use('/api/v1/cms', PostsController);

module.exports = app;