var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var UserSchema = mongoose.Schema({
    name : String,
    email : { type: String , require:true , unique:true},
    password : { type: String , require:true },
    created_at : Date,
    updated_at : Date
});

UserSchema.pre('save',function(next){
    var currentDate = new Date();

    this.updated_at = currentDate;

    if(!this.created_at)
        this.created_at = currentDate;

    next();
});


var User = mongoose.model('User' , UserSchema);

module.exports = User;

module.exports.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8) , null);
}

module.exports.validPassword = function (password , hash) {
    return bcrypt.compareSync(password, hash);
}
