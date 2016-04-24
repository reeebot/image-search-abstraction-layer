var mongo = require('mongodb').MongoClient;
var mongourl = 'mongodb://shorturl:short123@ds011291.mlab.com:11291/heroku_x1m61d7m';

module.exports = function Input(split, cb){     ////// input into the database
    mongo.connect(mongourl, function(err, db) {
        if (err) throw err
        var collection = db.collection('shorturl')

        var findone = collection.insert(data, function (err, data){       // insert data into database
                        if (err) throw err;
                        db.close(function(){
                            cb(random)                                  // return random shortURL number
                        });
                    })
                })
            };