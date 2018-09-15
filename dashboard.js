var express = require('express');
var router = express.Router();
var User = require('./model/user');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var Post = require('./model/post');
var Category = require('./model/category');
var Comment = require('./model/comment');

router.get('/login' , function (req, res) {
    res.render('login.pug' ,{
        title : "Login Page"
    });
});

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
passport.deserializeUser(function(id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});
passport.use('local-login' ,new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password'
    },
    function (email , password , done) {
        User.findOne({ email : email } , function (err , user) {
            if(err) { return done(err); }

            if(!user) {
                return done(null,false,{});
            }

            if(! User.validPassword(password , user.password)) {
                return done(null , false , {});
            }

            return done(null , user);
        });
    }
));

router.post('/login' , function (req ,res , next) {

    var email = req.body.email;
    var password = req.body.password;

    req.checkBody('email' , 'The email field is required').notEmpty();
    req.checkBody('password' , 'The password field is required').notEmpty();

    var errors = req.validationErrors();
    if (errors) {
        res.render('login.pug' , {
            title : 'Login Page',
            errors : errors
        });
        return;
    }

    next();
} , passport.authenticate('local-login' , { failureRedirect: '/dashboard/login' }), function (req, res) {
    console.log('login success');
    res.redirect('/dashboard');
});
router.get('/register' , function (req, res) {
    res.render('register.pug' , {
        title: 'Register Page'
    });
});
router.post('/register' , function (req, res) {
    var name  = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    var password_confirmation = req.body.password_confirmation;

    req.checkBody('name' , 'The Name field is required').notEmpty();
    req.checkBody('email' , 'The email field is required').notEmpty();
    req.checkBody('email' , 'The email must be a valid email adress').isEmail();
    req.checkBody('password' , 'The password field is required').notEmpty();
    req.checkBody('password_confirmation' , 'The Confirm Password field is required').notEmpty();
    req.checkBody('password_confirmation' , 'Password do not match').equals(password);


    var errors = req.validationErrors();
    if (errors) {
        res.render('register.pug' , {
            title : 'Register Page',
            errors : errors,
            name : name,
            email:email
        });
        return;
    }

    var newUser = new User({
        name:name,
        email:email,
        password: User.generateHash(password)
    });

    newUser.save(function (err) {
        if(err) throw err;

        res.redirect('/dashboard/login');
    });

});


router.use(function (req,res,next) {
    console.log((req.user));
    if(req.isAuthenticated()) {
        next();
        return;
    }
    res.redirect('/dashboard/login');
});


router.get('/' ,  function (req ,res) {

    Post.find({}).select({title: 1}).exec(function (err, posts) {
        if(err) throw err;

        res.render('dashboard/index.pug',{
            title: "Dashboard Page",
            posts: posts
        });

    })
});
router.get('/post/create', function (req, res) {
    Category.find({}).select("name").exec(function (err, categorys) {
        if(err) throw err;

        res.render('dashboard/form/create_post.pug',{
            title: 'Post Create',
            categorys : categorys
        })
    });
});
router.post('/post/create',function (req, res) {

    var title = req.body.title;
    var description = req.body.description;
    var category = req.body.category;

    req.checkBody('title' , 'the title field is required').notEmpty();
    req.checkBody('description' , 'the description field is required').notEmpty();
    req.checkBody('category' , 'the category field is required').notEmpty();

    var errors = req.validationErrors();
    if(errors) {

        Category.find({}).select("name").exec(function (err, categorys) {
            if(err) throw err;

            res.render('dashboard/form/create_post.pug',{
                title: 'Post Create',
                errors: errors,
                categorys : categorys
            })
        });
        return;

    }


    new Post({
        title:title,
        slug:title,
        description : description,
        category_id:category
    }).save(function (err, post) {
        if(err) throw err;

        res.redirect('/dashboard');
    });


});
router.delete('/post/:id/delete' , function (req, res) {
    Post.findByIdAndRemove(req.params.id , function (err, post) {
        if(err) throw err;

        res.redirect('/dashboard');
    })
});
router.get('/post/:id/edit' , function(req,res) {
    Post.findById(req.params.id , function (err, post) {
        if(err) throw err;

        Category.find({}).select("name").exec(function (err,categorys) {
            if(err) throw err;

            res.render('dashboard/form/edit_post.pug' , {
                title : post.title,
                post : post,
                categorys : categorys
            });
        })
    });
});
router.put('/post/:id' , function (req, res) {

    var title = req.body.title;
    var description = req.body.description;
    var category = req.body.category;

    req.checkBody('title' , 'the title field is required').notEmpty();
    req.checkBody('description' , 'the description field is required').notEmpty();
    req.checkBody('category' , 'the category field is required').notEmpty();

    var errors = req.validationErrors();
    if(errors) {
        res.redirect('/dashboard/post/'+ req.params.id + '/edit' );
        return;
    }


    Post.findByIdAndUpdate(req.params.id,{
        title: title,
        description:description,
        category_id : category
    } , function (err, post) {
        if(err) throw err;

        res.redirect('/dashboard');
    })


});

router.get('/category' , function (req, res) {
    Category.find({}).select("name").exec(function (err, categorys) {
        if(err) throw err;
        res.render('dashboard/category.pug',{
            title:"Category Page",
            categorys : categorys
        });
    })
});
router.get('/category/create',function (req, res) {
    res.render('dashboard/form/create_category.pug' , {
        title:"Create Categorys"
    });
});
router.post('/category/create' , function (req, res) {

    var name = req.body.name;
    var slug = req.body.slug;

    req.checkBody('name' , 'the name field is required').notEmpty();
    req.checkBody('slug' , 'the slug field is required').notEmpty();

    var errors = req.validationErrors();
    if(errors) {

        res.render('dashboard/form/create_category.pug',{
            title: 'Category Create',
            errors: errors
        });

        return;

    }


    new Category({
        name:name,
        slug:slug
    }).save(function (err) {
        if(err) throw err;

        res.redirect('/dashboard/category');
    })

});
router.delete('/category/:id/delete' , function (req, res) {
    Category.findByIdAndRemove(req.params.id , function (err, post) {
        if(err) throw err;

        res.redirect('/dashboard/category');
    })
});
router.get('/category/:id/edit' , function(req,res) {
    Category.findById(req.params.id , function (err, category) {
        if(err) throw err;

        res.render('dashboard/form/edit_category.pug' , {
            title : category.title,
            category : category,
        });

    });
});
router.put('/category/:id' , function (req, res) {

    var name = req.body.name;
    var slug = req.body.slug;

    req.checkBody('name' , 'the name field is required').notEmpty();
    req.checkBody('slug' , 'the slug field is required').notEmpty();

    var errors = req.validationErrors();
    if(errors) {
        res.redirect('/dashboard/category/' + req.params.id + '/edit');
        return;
    }


    Category.findByIdAndUpdate(req.params.id,{
        name: name,
        slug:slug
    } , function (err, category) {
        if(err) throw err;

        res.redirect('/dashboard/category');
    })


});

router.get('/comment' , function (req, res) {
    Comment.find({}).select('comment approved').exec(function (err , comments) {
        res.render('dashboard/comment.pug',{
            title: "Comment Page",
            comments : comments
        });
    })
});
router.delete('/comment/:id/delete' , function (req, res) {
    Comment.findByIdAndRemove(req.params.id , function (err) {
        if(err) throw err;

        res.redirect('/dashboard/comment');
    })
});
router.get('/comment/:id/approved' , function (req, res) {
    Comment.findByIdAndUpdate(req.params.id , {
        approved: true
    }, function (err) {
        if(err) throw err;

        res.redirect('/dashboard/comment');
    })
});


module.exports = router;