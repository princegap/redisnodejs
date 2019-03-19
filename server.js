//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan');
    
var redis = require("redis"),
    redisClient = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_IP);
	redisClient.auth(process.env.REDIS_PASSWORD);
redisClient.on("error", function (err) {
  console.error("REDIS Error " + err);
});

Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

var db = null,
    dbDetails = new Object();


app.get('/', function (req, res) {
  redisClient.set('my test key', 'my test value', redis.print);

});

app.get('/fetchdata', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('counts');
	var rowCount = 0;
	col.count(function(err, count){
      if (err) {
        console.log('Error running count. Message:\n'+err);
      }
	  rowCount = count;
    });
	col.find().limit(30).sort({'_id':-1}).toArray(function (err, result) {
		console.log(result);
      res.render('data.html', { pageCountMessage : rowCount, respData: result });
	});
  } else {
    res.render('data.html', { pageCountMessage : null});
  }
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

app.get('/fetchdatafrommongo', function(req,res) {
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').find().limit(30).sort({'_id':-1}).toArray(function (err, result) {
      res.json(result);
	});
  } else {
    res.send('{ pageCount: -1 }');
  }
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
