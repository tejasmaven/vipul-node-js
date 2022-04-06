const dotenv = require('dotenv'); //enviroment settings
const mongoose = require('mongoose'); //mongo DB database
dotenv.config();

//const server = process.env.DB_CONNECTION;
const server = process.env.DB_CONNECTION_LOCAL
//mongoose.connect('mongodb://127.0.0.1:27017/securing-rest-apis-with-jwt', { useMongoClient: true });
//mongoose.connect(`${server}`, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false })
 
mongoose.connect(`${server}`)
  .then(() => {
    console.log('Successfully connected to MongoDB!');
  })
  .catch(err => {
    console.log('Connection failed', err);
  });

console.log('mongoose database connection Status:' +mongoose.connection.readyState);