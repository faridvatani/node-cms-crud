var mongoose = require('mongoose');

var CommentSchema = mongoose.Schema({
    comment : { type: String , require:true  },
    commenter : { type: String , require:true },
    approved : Boolean ,
    post_id : mongoose.Schema.Types.ObjectId,
    created_at : Date,
    updated_at : Date
});

CommentSchema.pre('save',function(next){
    var currentDate = new Date();

    this.updated_at = currentDate;

    if(!this.created_at)
        this.created_at = currentDate;

    next();
});


var Comment = mongoose.model('Comment' , CommentSchema);

module.exports = Comment;
