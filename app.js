var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var mongoose = require('mongoose');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var methodOverride = require('method-override');

mongoose.connect('mongodb://localhost/NodeCourse');

var Post = require('./model/post');
var Comment = require('./model/comment');

// body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride(function(req, res){
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
    }
}));

app.use(cookieParser());
app.use(session({
    secret : 'faridvataniir',
    resave : false,
    saveUninitialized : true
}));

app.use(passport.initialize());
app.use(passport.session());

// In this example, the formParam value is going to get morphed into form body format useful for printing.
app.use(expressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.')
            , root    = namespace.shift()
            , formParam = root;

        while(namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param : formParam,
            msg   : msg,
            value : value
        };
    }
}));

var dashboard = require('./dashboard');

app.use(express.static(__dirname + '/public'));


// Route
app.use('/dashboard' , dashboard);
app.get('/' , function (req ,res) {
    Post.find({}).sort({created_at : 1}).exec(function (err, posts) {
        if(err) throw err;

        res.render('index.pug' , {
            title:"Website",
            posts : posts
        });

    })
});
app.get('/article/:slug' , function (req, res) {
    Post.find({slug : req.params.slug } , function (err, post) {
        if(err) throw err;

        var post = post[0];

        Comment
            .find({post_id : post._id })
            .where('approved').equals(true)
            .exec(function (err, comments) {
                if(err) throw err;

                res.render('single.pug' , {
                    title : post.title,
                    post:post,
                    comments : comments
                });

            });
    })
});
app.post('/comment' , function (req, res) {

    var commenter = req.body.commenter;
    var comment = req.body.comment;
    var post_id = req.body.post_id;

    req.checkBody('commenter' , 'the commenter field is required').notEmpty();
    req.checkBody('comment' , 'the comment field is required').notEmpty();
    req.checkBody('post_id' , 'the post_id field is required').notEmpty();

    var errors = req.validationErrors();
    if(errors) {
        res.redirect(req.get('referer'));
        return;
    }


    new Comment({
        comment : comment,
        commenter : commenter,
        post_id : post_id,
        approved: false
    }).save(function (err) {
        if(err) throw err;

        res.redirect(req.get('referer'));

    })
});

app.listen(3000, function () {
    console.log('express is running on port 3000');
});