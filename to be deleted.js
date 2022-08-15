

const mongoose = require('mongoose');

// mongoose.connect("mongodb+srv://macb:vGdEAESmK0GRqDrl@cluster.xfzxm.mongodb.net/?retryWrites=true&w=majority");

mongoose.connect("mongodb://localhost/sup");
var express=require("express");
var bodyParser =require("body-parser");

// require('dotenv').config();

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


// new=================================================================================================
var multer = require("multer"); 
var storage = multer.diskStorage({
    
    filename: function(req, file, callback) {
      callback(null, Date.now() + file.originalname);
    }
  });
  var imageFilter = function(req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  };
  const upload = multer({
    storage: storage,
    fileFilter: imageFilter
  });
  
  var cloudinary = require("cloudinary");
  cloudinary.config({
    cloud_name:"macb",
    api_key:"182998264394398",
    api_secret:"zhmA4pTMuHfdIn0oL8S_nAykl8c"
  });
  
 
// new=================================================================================================


app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"))
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(flash());
// note all static file goes in the public dir.....make sure to select it in that ways

// PASSPORT CONFIG==================================================
app.use(require("express-session")({
    secret:"the secret",
    resave:false,
    saveUninitialized:false
}));

app.locals.moment = require("moment");
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// PASSPORT CONFIG==================================================

// OUR OWN MIDDLEWARE
// this registers current user on eachh and every template with /partials/header or footer
app.use(function(req,res,next){
    res.locals.currentUser=req.user;
    // note this also makes "massage" be recognised on every template rather than adding it individualy on every temp
    // res.locals.massage=req.flash("error");
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    next();
}); 


app.get("/",function(req,res){
    res.render("landingPageV1.ejs");
});

app.get("/memo", function(req,res){
      res.render("memo.ejs")
});

// Note there is "req.user" this checks if the user is authenticated or logged in
app.get("/blogs",function(req,res){
    Blog.find({}, function(err,Allblogs){
        if(err){
            console.log(err)
        } else{
            console.log("SUCCESSFUL!!")
        };

        res.render("blogsV1.ejs",{blogs:Allblogs,currentUser:req.user});
        
    });
   
  
});

app.post("/blogs", isLoggedIn, upload.single("image"), function(
    req,
    res
  ) {
    cloudinary.v2.uploader.upload(
      req.file.path,
      {
        width: 1500,
        height: 1000,
        crop: "scale"
      },
      function(err, result) {
        if (err) {
          req.flash("error", err.message);
          
        }else{
           console.log (result);
            req.body.blog.image = result.secure_url;
            req.body.blog.imageId = result.public_id;

        }
        
        req.body.blog.author = {
          id: req.user._id,
          username: req.user.username
        };
        
          Blog.create(req.body.blog, function(err, blog) {
            if (err) {
              req.flash("error", err.message);
              return res.render("error");
            }
            res.redirect("/blogs");
          
        });
      },
      {
        moderation: "webpurify"
      }
    );
  });
    

app.get("/blogs/new",isLoggedIn,function(req,res){
     res.render("new.ejs" ,{currentUser:req.user});
       
});

// THIS SHOWS MORE INFO ABT A BLOG

app.get("/blogs/:id", function(req, res){
    Blog.findById(req.params.id).populate("comments").exec(function(err,foundBlog){
        // NOTE that what ".populate("").exec(callback)"_____this makes the referred data to display proparly...not just Ids  
        if(err){
            console.log(err); 
        }else{
            res.render("show.ejs", {blog:foundBlog, currentUser:req.user} );
        };
    });

});
// UPDATE AND DESTROY RUOTES===============================================
app.get("/blogs/:id/edit",isLoggedIn,checkOwnership,function (req,res){
  
        Blog.findById(req.params.id, function(err,foundBlog){
            if(err){
                req.flash("error","You can only edit your posts");
                res.redirect("/blogs");
            }else{
                  res.render("edit.ejs",{blog:foundBlog});
               }; 
            })
});

app.put("/blogs/:id",function(req,res){
 
      Blog.findByIdAndUpdate(req.params.id,req.body.blog, function(err,updatedBlog){
           if(err){
               console.log(err)
               req.flash("error","Failed to update");
               res.redirect("/blog")
           }else{
            req.flash("success","Successfully updated blog");
               res.redirect("/blogs");
           }
      });
});
// DELETE
app.delete("/blogs/:id",function(req,res){
    Blog.findByIdAndDelete(req.params.id,function(err){
        if(err){
            req.flash("error",err.message);
            res.redirect("/blogs");
        }else{
            req.flash("success","Successfully deleted post");
            res.redirect("/blogs");
        };
    });
});

app.delete("blogs/:id/comments/:comment_id",function(req,res){
    Comment.findByIdAndDelete(req.params.comment_id,function(err){
        if(err){
            req.flash("error",err.message);
            res.redirect("/blogs/:id");
        }else {
            Blog.findByIdAndUpdate(
              req.params.id,
              { $pull: { comments: { $in: [req.params.comment_id] } } },
              function(err) {
                if (err) {
                  console.log(err);
                }
              }
            );
            Blog.findByIdAndUpdate(
              req.params.id,
              { $pull: { hasRated: { $in: [req.user._id] } } },
              function(err) {
                if (err) {
                  console.log(er);
                }
              }
            );
            req.flash("success", "Review deleted!");
            res.redirect("/campgrounds/" + req.params.id);
          }
        });
      });


// UPDATE AND DESTROY FOR COMMENTS
app.get("/blogs/:id/comments/:comments_id/edit",function(req,res){
    //   res.render("edit form")
});

// UPDATE AND DESTROY RUOTES===============================================

// =============================================================================================
// COMMENTS nested Routes

app.get("/blogs/:id/comments/new",isLoggedIn, function(req,res){
    Blog.findById(req.params.id, function(err,blog){
        if(err){
            console.log(err)
        }else{
            res.render("commentsNew.ejs" ,{blog:blog, currentUser:req.user});
        };
   });
      
})

app.post("/blogs/:id/comments",function(req,res){
     Blog.findById(req.params.id, function(err,blog){
          if(err){
              console.log(err)
          }else{
            Comment.create(req.body.com, function(err,comment){
                if(err){
                    console.log(err)
                }else{
                    comment.author.id=req.user._id;
                    comment.author.username=req.user.username;
                   blog.comments.push(comment);
                  
                   blog.save();
                   res.redirect("/blogs/"+blog._id);
                };
            });
          };
     });
});
// =============================================================================================

// AUTH ROUTES=============================================================================

// REGISTER
app.get("/register",function(req,res){
      res.render("register.ejs",{currentUser:req.user});
});
app.post("/register", function(req,res){
     newUser = new User({
        username: req.body.username,
        surname: req.body.surname,
        email: req.body.email,
        address: req.body.address,
      });
      User.register(newUser,req.body.password,function(err,user){
           if(err){
            req.flash("error",err.message);
               console.log(err)
               res.redirect("/register");
           }
            passport.authenticate("local")(req,res,function(){
             req.flash("success", "Successfully registered");  
             res.redirect("/blogs");
         });
      });
});

// LOGIN
app.get("/login",function(req,res){
    res.render("login.ejs",{currentUser:req.user, massage: req.flash("error")});
});
app.post("/login",passport.authenticate("local", {
         
         successRedirect:"/blogs",
         successFlash:"succesfully Logged in",
         failureRedirect:"/login",
         failureFlash:true
}),function(req,res){
   
});

// LOGOUT
app.get("/logout",function(req,res){
    req.logout();
    req.flash("success","Successfully logged out");
    res.redirect("/blogs");
    // res.render("login.ejs",{currentUser:req.user});
});

// Middleware
function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    // we use flash with 2 arguments e.g req.flash("key", "value");
     req.flash("error","Please loggin first");
     res.redirect("/login");
    };
    
    // Our Middleware to check ownership of the poster
    function checkOwnership(req,res,next){
    if(req.isAuthenticated()){
        Blog.findById(req.params.id, function(err,foundBlog){
            if(err){
                console.log(err);
                res.redirect("back");
            }else{
                
                // does user own the blog?
                if(req.user._id.equals(foundBlog.author.id)){
                    //    note we used ".equals()" instead of "===" for comparison !!!!!
                    next();
                }else{
                    req.flash("error","You Can only edit your own posts");
                    res.redirect("back");
                };
            };
        });
    };
}

// AUTH ROUTE=============================================================================

// MIDDLEWARES CAN BE REFACTORED INTO ANOTHER DIR AND THEN REQUIRED  

app.listen(122,function(){
    console.log("App Has Started!!!!");
});