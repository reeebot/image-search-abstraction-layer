var express = require('express')
var app = express()
var url = require('url')
var port = process.env.PORT || 8080;

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
  var splitoffset = url.parse(req.url).query.split(/=/, 2)   // split query at =
  var pagenum = 0
  if (splitoffset[0] === "offset") {                         // set the page number
    pagenum = +splitoffset[1] * 10
  }
  var searchterm = req.params.search;  // use :search at the top and req.params.search here
  request.get({
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
    res.send(arr)
  });
});

////// start server
app.listen(port, function() {
	console.log('server listening')
})