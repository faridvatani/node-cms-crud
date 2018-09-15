var mongoose = require('mongoose');

var CateSchema = mongoose.Schema({
    name : { type: String , require:true  },
    slug : { type: String , require:true },
    created_at : Date,
    updated_at : Date
});

CateSchema.pre('save',function(next){
    var currentDate = new Date();

    this.updated_at = currentDate;

    if(!this.created_at)
        this.created_at = currentDate;

    next();
});


var Category = mongoose.model('Category' , CateSchema);

module.exports = Category;
