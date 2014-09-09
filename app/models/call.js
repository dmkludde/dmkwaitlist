// app/models/user.js
// load the things we need
var mongoose = require('mongoose');

var callingSchema = mongoose.Schema({
    owner           : Number,
    description            : String,
    affectedids     : [Number]
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Call', callingSchema);
