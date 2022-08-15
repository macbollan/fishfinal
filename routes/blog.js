var express = require("express");
var router = express.Router();


const mongoose = require('mongoose');
//  mongoose.connect("mongodb+srv://macb:vGdEAESmK0GRqDrl@cluster.xfzxm.mongodb.net/?retryWrites=true&w=majority");

var express=require("express");
var bodyParser =require("body-parser");

require('dotenv').config();

var app=express();
var passport =require("passport");
var LocalStrategy =require("passport-local");
var methodOverride=require("method-override");
var flash =require("connect-flash");
// note that we have to require the modeled files 
var Blog=require("./models/blog.js");
var Comment=require("./models/comments");
var User=require("./models/user");
const user = require("./models/user");
const { findByIdAndUpdate } = require("./models/blog.js");
var geocoder = require('geocoder');
var multer= require ("multer");
var path= require("path");

