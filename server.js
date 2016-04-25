var express = require('express')
var app = express()
var url = require('url')
var port = process.env.PORT || 8080;
var mongo = require('mongodb').MongoClient;
var mongourl = 'mongodb://imgsearch:search@ds019481.mlab.com:19481/heroku_bpl2qs9g';

////// BING IMG API account setup
var acctKey = 'Qd4xhMDeQE2df0oLuIeJfgh7eAaonO077gqpOhQY+Mc';
var rootUri = 'https://api.datamarket.azure.com/Data.ashx/Bing/Search/Image';
var auth    = new Buffer([ acctKey, acctKey ].join(':')).toString('base64');
var request = require('request').defaults({
  headers : {
    'Authorization' : 'Basic ' + auth
  }
});

////// serve static index.html
app.route('/').get(function (req, res) {
	res.sendFile(process.cwd()+'/public/index.html');
});

////// image search
app.get('/imgsearch/:search', function(req, res) {
  var pagenum = 0
  if (url.parse(req.url).query){                                // checks if a query was sent with search request (page number)
    var splitoffset = url.parse(req.url).query.split(/=/g, 2)   // split query at =
    if (splitoffset[0] === "offset") {                          // set the page number
      pagenum = +splitoffset[1] * 10
    }
  }
  var searchterm = req.params.search;  // use :search at the top to capture the entry and req.params.search here
  request.get({                        // send the search request to BING IMG API
    url : rootUri,
    qs  : {
      $format : 'json',
      Query   : "'" + searchterm + "'",
      $skip   : pagenum,
      $top    : 10
    }
  }, function(err, response, body) {
    if (err)
      return res.status(500, err.message);
    if (response.statusCode !== 200)
      return res.status(500, response.body);
    var results = JSON.parse(response.body);
    var arr = []
    for (var id in results.d.results) {       // goes through search results and pulls selected fields into new array
      arr.push({ url : results.d.results[id].MediaUrl,
      snippet : results.d.results[id].Title,
      thumbnail : results.d.results[id].Thumbnail.MediaUrl,
      context : results.d.results[id].SourceUrl
      })}
    //// save the searchterm and searchtime to db for history tracking
    var data = {                      // setup the input data for db
      search : searchterm,
      time : new Date().toISOString() // grab current time
    }
    mongo.connect(mongourl, function(err, db) {
      if (err) throw err
      var collection = db.collection('imagesearch')
      var insert = collection.insert(data, function (err, data){       // insert data into database
        if (err) throw err;
        db.close()
      });
    })
    res.send(arr)
  });
});

////// display history
app.get('/history', function(req, res) {
  mongo.connect(mongourl, function(err, db) {
    if (err) throw err
    var collection = db.collection('imagesearch')
    var findhistory = collection.find( {},{ _id : 0 } ).sort({_id:-1}).limit(10)
    findhistory.toArray(function(err, data) {
      if (err) throw err;
      db.close(function(){
        res.send(data)
      })
    })
  })
})

////// start server
app.listen(port, function() {
	console.log('server listening')
})