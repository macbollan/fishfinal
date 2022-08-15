var mongoose=require("mongoose");

var videoSchema= mongoose.Schema({
    filePatht:String,
    createdAt: { type: Date, default: Date.now },
    title:String,
    description:String,
    filePath:String,
    author:{
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username:String 
    },
});
// Note that we have added author with an Id and a username inorder to associate the logged in user with the comment

module.exports=mongoose.model("Video", videoSchema);

