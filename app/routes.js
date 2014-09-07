// app/routes.js
var User       		= require('../app/models/user');

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
        User.find( {'local.timestamp' : {$gt : 0} })
            .limit(10)
            .sort({'local.timestamp' : 1})
            .select('local.timestamp local.pfsid local.forumname local.status')
            .where('local.status').in(['Active'])
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
                                'status' : theuser[i].local.status      
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
    
    app.get('/activate', isLoggedIn, function(req, res) {
        req.user.local.status = "Active";
        req.user.local.timestamp = new Date();
        req.user.save(function(err) {
            res.redirect('/profile');
        });
    });
    app.get('/deactivate', isLoggedIn, function(req, res) {
        req.user.local.status = "Inactive";
        req.user.local.timestamp = new Date();
        req.user.save(function(err) {
            res.redirect('/profile');
        });
    });
};

// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}
