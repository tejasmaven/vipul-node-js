var express = require('express');
var app = express();
var db = require('./db');
global.__root   = __dirname + '/';

app.get('/api/v1', function (req, res) {
  res.status(200).send('API works.');
});

/*Router*/
var UserController = require(__root + 'user/UserController');
app.use('/api/v1/users', UserController);

var AuthController = require(__root + 'auth/AuthController');
app.use('/api/v1/auth', AuthController);

module.exports = app;