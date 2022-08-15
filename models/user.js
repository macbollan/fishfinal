var mongoose= require("mongoose");
var passportLocalMongooose=require("passport-local-mongoose");

var UserSchema= new mongoose.Schema({
    
    username:String,
    surname:String,
    email:String,
    phone:String,
    password:String,
    image:String,
    imageId:String,
    address:String
});

UserSchema.plugin(passportLocalMongooose);
module.exports=mongoose.model("User",UserSchema);