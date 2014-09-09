// app/routes.js
var User       		= require('../app/models/user');
var Call       		= require('../app/models/call');
var DMKid = '108716';
module.exports = function(app, passport) {

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', function(req, res) {
        if (req.isAuthenticated()) {
            res.redirect('/profile');
        }
        res.render('index.ejs' ); // load the index.ejs file
	});

    app.get('/list', function(req,res){
        liststatus = ['Active', 'Inactive'];
        limitnumber = 999;
        thequery = {'local.timestamp' : {$gt : 0} };
        if(req.query){
            if (req.query.status){
                liststatus = [req.query.status];
                if (req.query.status == "FullList"){
                    liststatus = ['Active', 'Inactive', 'Called', 'InGame'];
                }
                if (req.query.status == "DisplayList"){
                    liststatus = ['Active', 'Called'];
                }
                if (req.query.status == "CalledAccept"){
                    liststatus = ['Called', 'InGame'];
                }
                if (req.query.status == "CallableList"){
                    liststatus = ['Active'];
                }
                if (req.query.origin){
                    thequery = {'local.timestamp' : {$gt :0}, 'local.calledpfsid' : parseInt(req.query.origin) }; 
                }
            }
        }
        User.find( )
            .limit(limitnumber)
            .sort({'local.timestamp' : 1})
            .select('local.timestamp local.pfsid local.forumname local.status local.calledpfsid')
            .where('local.status').in(liststatus)
            .exec( 
                function(err,theuser) {
                    if(err) {
                        console.log("Err"); console.log(err);}
                        //res.send("");
                    if(theuser) {
                        results=[];
                        for (var i=0; i<theuser.length; i++){
                            //result = theuser[i].local.pfsid;
                            result = {
                                'pfsid' : theuser[i].local.pfsid,
                                'name' : theuser[i].local.forumname,
                                'timestamp' : theuser[i].local.timestamp.getTime(),
                                'status' : theuser[i].local.status,
                                'calledby' : theuser[i].local.calledpfsid
                            };
                            results.push(result);
                            
                            
                        }
                        console.log(results);
                        res.send(results);
                    }
                });
        //res.send("Aap");
    });

    // =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function(req, res) {
		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup', function(req, res) {
		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// PROFILE SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			user : req.user // get the user out of session and pass to template
		});
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
    
    // ====
    // User status
    // ====
    app.get('/transition', isLoggedIn, function(req, res){
        if(req.query && req.query.status){
            var trans = transitionType(req.user.local.status, req.query.status);
            if (trans.allowed) {
                req.user.local.status = req.query.status;
                if (trans.resetTime)  req.user.local.timestamp = new Date();
            }
        }
        req.user.save(function(err) {
            res.redirect('/profile');
        });
    });
    
    app.get('/activate', isLoggedIn, function(req, res) {
        res.redirect('/transition?status=Active');
//        if(req.user.local.status == "Inactive"){
//            req.user.local.status = "Active";
//            req.user.local.timestamp = new Date();
//        }
//        req.user.save(function(err) {
//            res.redirect('/profile');
//        });
    });
    
    app.get('/deactivate', isLoggedIn, function(req, res) {
        if (req.user.local.status){
        req.user.local.status = "Inactive";
        req.user.local.timestamp = new Date();
        req.user.save(function(err) {
            res.redirect('/profile');
        });
        }
    });
    
    app.get('/callplayer', isLoggedIn, function(req,res) {
        if(req.user.local.dmactive){
            User.findOne({ 'local.pfsid' : req.query.pfsid })
                .exec(function(err,user){
                    if(err)
                        throw err;
                    if(user){
                        console.log("Found user " + user.local.pfsid);
                        var trans = transitionType(user.local.status, 'Called');
                        if (trans.allowed){
                            user.local.status = 'Called';
                            
                            console.log("Called by " + req.user.local.pfsid);
                            user.local.calledpfsid = parseInt(req.user.local.pfsid);
                            console.log(user.local);
                        }
                        user.save(function(err){
                            res.redirect('/profile');
                        });
                    }            
                });
        } else {
            res.redirect('/profile');
        }
    });
    app.get('/uncallplayer', isLoggedIn, function(req,res) {
        if(req.user.local.dmactive){
            User.findOne({ 'local.pfsid' : req.query.pfsid })
                .exec(function(err,user){
                    if(err)
                        throw err;
                    if(user){
                        console.log("found user");
                        console.log(user.local.pfsid);
                        var trans = transitionType(user.local.status, 'Active');
                        if (trans.allowed){
                            user.local.status = 'Active';
                            user.local.calledpfsid = 0;
                        }
                        user.save(function(err){
                            res.redirect('/profile');
                        });
                    }            
                });
        } else {
            res.redirect('/profile');
        }
    });
    
    app.get('/makedm', isLoggedIn, function(req, res) {
        if(req.user.local.pfsid == DMKid){
            if(req.query && req.query.pfsid) {
                User.findOne({ 'local.pfsid' : req.query.pfsid })
                .exec(function(err,user){
                    if(err)
                        throw err;
                    if(user){
                        console.log("found user");
                        console.log(user.pfsid);
                        user.local.dmactive = "True";
                        user.save(function(err) {
                            res.redirect('/profile');
                        });
                    }            
                });
            }
        } else {
            res.redirect('/');
        }
        //
    });
    
};

var transMatrix = { 'Inactive' : {  'Inactive' : {'allowed' : false, 'resetTime' : false},
                                    'Active'   : {'allowed' : true,  'resetTime' : true},
                                    'Called'   : {'allowed' : false, 'resetTime' : false},
                                    'InGame'   : {'allowed' : false, 'resetTime' : false}
                                 },
                    'Active'   : {  'Inactive' : {'allowed' : true,  'resetTime' : true},
                                    'Active'   : {'allowed' : false, 'resetTime' : false},
                                    'Called'   : {'allowed' : true,  'resetTime' : false},
                                    'InGame'   : {'allowed' : false, 'resetTime' : false}
                                 },
                    'Called'   : {  'Inactive' : {'allowed' : true,  'resetTime' : true},
                                    'Active'   : {'allowed' : true,  'resetTime' : false},
                                    'Called'   : {'allowed' : false, 'resetTime' : false},
                                    'InGame'   : {'allowed' : true,  'resetTime' : true}
                                 },
                    'InGame' :   {  'Inactive' : {'allowed' : false, 'resetTime' : false},
                                    'Active'   : {'allowed' : true,  'resetTime' : true},
                                    'Called'   : {'allowed' : false, 'resetTime' : false},
                                    'InGame'   : {'allowed' : false, 'resetTime' : false}
                                 },
                  };

function transitionType(fromstatus, tostatus){
    console.log(fromstatus);
    console.log(tostatus);
    return transMatrix[fromstatus][tostatus];
}

// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}
