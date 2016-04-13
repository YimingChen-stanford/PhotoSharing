"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be implemented:
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
var async = require('async');
var session = require('express-session');
var bodyParser = require('body-parser');
var fs = require("fs");
var multer = require('multer');



var processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

var express = require('express');
var app = express();

mongoose.connect('mongodb://localhost/cs142project6');
var db = mongoose.connection;


// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));

app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());


app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';
    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.count({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));

            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {

    if(!request.session.login_name){
        response.status(401);
                return;
    }

    User.find({},'id first_name last_name',function (err, users) {
        if(err){
            console.error('Doing /user/list error:', err);
            response.status(500).send(JSON.stringify(err));
            return;
        }
       
        response.end(JSON.stringify(users));
    /*users is an array of objects*/ });
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
    if(request.session.user_id===undefined){
        response.status(401);
                return;
    }
    var param = request.params.id;
    if(param.length<5){
        response.status(400).send(JSON.stringify("invalid input"));
    }

    User.findOne({id:param},'id first_name last_name location description occupation',function (err, users) {
        if(err){
            console.error('Doing /user/:id error:', err);
            response.status(500).send(JSON.stringify(err));
            return;
        }
        response.end(JSON.stringify(users));
        });
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {
    if(request.session.user_id===undefined){
        response.status(401);
                return;
    }
    var param = request.params.id;
    if(param.length<5){
        response.status(400).send(JSON.stringify("invalid input"));
    }
    Photo.find({user_id:param},function (err, photos) {
        if(err){
            console.error('Doing /photosOfUser/:id error:', err);
            response.status(500).send(JSON.stringify(err));
            return;
        }
         

        var result = JSON.parse(JSON.stringify(photos));
        async.each(result,function fetchUsers(photo, callback){
            async.each(photo.comments,function fetchCommentUsers(comment,callback){
            
            User.findOne({_id:comment.user_id},'first_name last_name id',function (err, users) {
                if(err){
                    
                    console.error('Doing /user/:id error:', err);
                    response.status(500).send(JSON.stringify(err));
                    return;
                }

                    comment.user = users;
                    callback(err);
                });
        },function allisDone(err){
            if (err) {
                response.status(500).write(err.message);
            }
            callback(err);
        });
        },function allDone(err){
            if (err) {
            
                response.status(500).write(err.message);
                }  
            response.end(JSON.stringify(result));

        });
        

        
        });
});

app.post('/admin/login', function (request, response) {
     
    var user_name = request.body.login_name;
    var password = request.body.password;
    
    User.findOne({login_name:user_name},'password id first_name login_name mention',function (err, user) {
        if(err){
            console.error('Doing /admin/login error:', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
       
        if(user.password===password){
                 var result = JSON.parse(JSON.stringify(user));
                 result.mentionPhotos=[];
        request.session.user_id = user.id;
        request.session.login_name = user.login_name;
                if(!user.mention){
                    
                    response.end(JSON.stringify(result));
                    return;
                }
               else{
                async.each(user.mention,function fetchMentionPhotos(photoId,callback){
                    Photo.findOne({id:photoId},function (err, photo) {
                        if(err){
                            console.error('Doing /admin/login error:', err);
                            response.status(400).send(JSON.stringify(err));
                            return;
                        }
                        result.mentionPhotos.push(JSON.parse(JSON.stringify(photo)));
                        console.log("last test");
                       
                        callback(err);  
                    });
                },function doneFindMention(err){
                    if (err) {        
                        response.status(500).write(err.message);
                    }  
                    console.log(result.mentionPhotos);
                    

                    async.each(result.mentionPhotos,function fetchUserName(photo, callback){
                        User.findOne({id:photo.user_id},'first_name id',function (err, user) {
                            if(err){
                                console.error('Doing /user/:id error:', err);
                                response.status(500).send(JSON.stringify(err));
                                return;
                            }
                            photo.user = JSON.parse(JSON.stringify(user));
                            console.log("%^^^^&&&&&&&&&");
                            console.log(photo.user);
                            callback(err);
                        });
                    },function allFindMentionDone(err){
                        if (err) {
                            response.status(500).write(err.message);
                            
                        }
                       
                            console.log(result);
                            response.end(JSON.stringify(result));
                            return;                     

                    });
                });
               }
               
        }

        else{
            response.status(401).send();
        return;
        }
        });
});


app.post('/admin/logout', function (request, response) {
    
    delete request.session.user_id;
    delete request.session.login_name;

    request.session.destroy(function (err) { 
        response.end();
    });
    
});
app.post('/commentsOfPhoto/:photo_id', function (request, response) {
    if(request.session.user_id===undefined){
        response.status(401);
                return;
    }

    var commentCotent = request.body.comment;
    var mention_id = request.body.mention_id;
    if(commentCotent===undefined||!commentCotent){
        console.log("________"+">>>>"+commentCotent);
        response.status(400).send();
        return;
    }
    var photoId = request.params.photo_id;
    console.log("________"+photoId+">>>>"+commentCotent);
    var userId = request.session.user_id;
    Photo.findOne({id:photoId},function (err, photo) {
        if(err){
            console.error('Doing /commentsOfPhoto/:photo_id error:', err);
            response.status(500).send(JSON.stringify(err));
            return;
        }
        var comment = {comment:commentCotent,user_id:userId};
        photo.comments.push(comment);
        photo.save();
        if(mention_id){
            async.each(mention_id,function fetchCommentUsers(userId,callback){
                User.findOne({id:userId},function (err, user) {
        if(err){
            console.error('Doing /admin/login error:', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
         user.mention.push(photoId);
         console.log("%%%%"+photoId);
         user.save();
         callback(err);  
        });
        },function doneAddMention(err){
            if (err) {        
                response.status(500).write(err.message);
                }  
            response.end();
        });
        }
        
        });
    
});


app.post('/photos/new', function (request, response) {
    if(request.session.user_id===undefined){
        response.status(401);
                return;
    }
    processFormBody(request, response, function (err) {
        if (err || !request.file) {
            // XXX -  Insert error handling code here.
            return;
        }
        // request.file has the following properties of interest
        //      fieldname      - Should be 'uploadedphoto' since that is what we sent
        //      originalname:  - The name of the file the user uploaded
        //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
        //      buffer:        - A node Buffer containing the contents of the file
        //      size:          - The size of the file in bytes

        // XXX - Do some validation here.
        // We need to create the file in the directory "images" under an unique name. We make
        // the original file name unique by adding a unique prefix with a timestamp.
        var timestamp = new Date().valueOf();
        var filename = 'U' +  String(timestamp) + request.file.originalname;

        fs.writeFile("./images/" + filename, request.file.buffer, function (err) {
          
          User.findOne({id:request.session.user_id},'password id first_name login_name',function (err, user) {
        if(err){
            console.error('Doing /admin/login error:', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
         Photo.create({
                  id: request.session.user_id,
                  file_name: filename,
                  date_time: timestamp,
                  user_id: user,
                  comments: []
                }, function(err, newPhoto) {
                    if(!err){
                    newPhoto.id = newPhoto._id;
                    newPhoto.save();
                    response.end();
                    }
                    
                });   
        });
          

        });
    });
    
});

app.post('/user', function (request, response) {
    var savelogin_name = request.body.login_name;
    var savepassword = request.body.password;
    var savefirst_name = request.body.first_name;
    var savelast_name = request.body.last_name;
    var savelocation = request.body.location;
    var savedescription = request.body.description;
    var saveoccupation = request.body.occupation;
    console.log(savelogin_name);
    User.findOne({login_name:savelogin_name},function (err, user) {
        if(err){ 
            response.status(500).send(JSON.stringify(err));
            return;
        }
        if(user===null){
                User.create({
                first_name: savefirst_name, // First name of the user.
                last_name: savelast_name,  // Last name of the user.
                location: savelocation,    // Location  of the user.
                description: savedescription,  // A brief user description
                occupation: savedescription,    // Occupation of the user.
                login_name: savelogin_name,
                password: savepassword
                }, function(err, newUser) {
                    if(!err){
                    newUser.id = newUser._id;
                    newUser.save();
                    response.end();
                    }
                });
        }
        else{
        response.status(401).send();
        }  
        return;
        });

      
});

app.get('/search', function (request, response) {
    var keyword = request.query.keyword;
    var searchKey  = "\""+keyword+"\"";
    
    Photo.find({$text: {$search:searchKey}},function (err, photos) {
        if(err){
            console.error('Doing /search error:', err);
            response.status(500).send(JSON.stringify(err));
            return;
        }
         var result = JSON.parse(JSON.stringify(photos));
        async.each(result,function fetchUsers(photo, callback){
            async.each(photo.comments,function fetchCommentUsers(comment,callback){
            
            User.findOne({_id:comment.user_id},'first_name last_name id',function (err, users) {
                if(err){
                    
                    console.error('Doing /user/:id error:', err);
                    response.status(500).send(JSON.stringify(err));
                    return;
                }
                    comment.user = users;
                    callback(err);
                });
        },function allisDone(err){
            if (err) {
                response.status(500).write(err.message);
            }
            callback(err);
        });
        },function allDone(err){
            if (err) {
            
                response.status(500).write(err.message);
                } 
            async.each(result,function fetchUserName(photo, callback){
                User.findOne({id:photo.user_id},'first_name id',function (err, user) {
                if(err){
                    
                    console.error('Doing /user/:id error:', err);
                    response.status(500).send(JSON.stringify(err));
                    return;
                }
                    photo.user = user;
                    callback(err);
                });
            },function allSearchCommentsDone(err){
            if (err) {
                response.status(500).write(err.message);
            }
            response.end(JSON.stringify(result));
            
        });

        });
        
        });
});




var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});


