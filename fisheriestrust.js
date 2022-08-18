

const mongoose = require('mongoose');
 mongoose.connect("mongodb+srv://macb:vGdEAESmK0GRqDrl@cluster.xfzxm.mongodb.net/?retryWrites=true&w=majority");
require('dotenv').config();

var express=require("express");
var bodyParser =require("body-parser");
// const { getVideoDurationInSeconds } = require('get-video-duration');






var app=express();
var passport =require("passport");
var LocalStrategy =require("passport-local");
var methodOverride=require("method-override");
var flash =require("connect-flash");
// note that we have to require the modeled files 
var Blog=require("./models/blog.js");
var Comment=require("./models/comments");
var User=require("./models/user");
var Video=require("./models/video");
const user = require("./models/user");
const { findByIdAndUpdate } = require("./models/blog.js");
var geocoder = require('geocoder');
var multer= require ("multer");
var path= require("path");
const formidable = require('formidable');
var fileSystem = require("fs");


// mongoose.connect("mongodb://localhost/fishywithvideos5");

// const connectDB= async()=>{
//     try{
//         const con= await mongoose.connect("mongodb+srv://macb:vGdEAESmK0GRqDrl@cluster.xfzxm.mongodb.net/?retryWrites=true&w=majority",{
//             useNewUrlParser:true,
//             useUnifiedTopology:true,
//         })
//         console.log("DB connected: ${con.connection.host} ");
//     }catch(err){
//         console.log(err);
//         process.exit(1)
//     }
// }

// connectDB()

  
 
// new=================================================================================================

app.use(bodyParser.json( { limit: "10000mb" } ));
app.use(bodyParser.urlencoded( { extended: true, limit: "10000mb", parameterLimit: 1000000 } ));


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




// ==========================================================================================================================================
    // UPLOADING AND DESPLOYING BLOGS




    var storage = multer.diskStorage({
        filename: function(req, file, callback) {
          callback(null, Date.now() + file.originalname);
        }
      });

    //define storage for the images

    var imageFilter = function(req, file, cb) {
        // accept image files only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
          return cb({ message: "This file is not an image file" }, false);
        }
        cb(null, true);
      };

  //upload parameters for multer
  const upload = multer({
    storage: storage,
    fileFilter: imageFilter
    // limits: {
    //   fieldSize: 1024 * 1024 * 3,
    // },
  });

var cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: "macb",
  api_key: "182998264394398",
  api_secret: "zhmA4pTMuHfdIn0oL8S_nAykl8c"
});



app.get('/sitemap.xml', function(req, res) {
    res.sendFile(__dirname + '/1660711859719output.xml');
    });

    app.get("/about", (req,res)=>{
        res.render("about.ejs");
         })    



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
      phone: req.body.phone,
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
       
       successFlash:"succesfully Logged in",
       successRedirect:"/blogs",
       failureRedirect:"/login",
       failureFlash:true
}),function(req,res){
 
});

// LOGOUT
app.get("/logout",function(req,res){
  req.logout( (err)=>{
        if(err){
            console.log(err)
        }else{

            req.flash("success","Successfully logged out");
            res.redirect("/blogs");
            // res.render("login.ejs",{currentUser:req.user});
        }
  } );
});



app.get("/leaders",function(req,res){
    res.render("leaders.ejs");
});

app.get("/memo", function(req,res){
      res.render("memo.ejs")
});



app.get("/",function(req,res){
    res.render("landingPageV1.ejs");
});


// Note there is "req.user" this checks if the user is authenticated or logged in
app.get("/blogs",function(req,res){
    Blog.find({}, function(err,Allblogs){
        if(err){
            console.log(err)
        }
        Video.find({},function(err,videos){
            if(err){
                console.log(err)
            }
           res.render("blogsV1.ejs",{blogs:Allblogs,currentUser:req.user, videos:videos});
        
    });
});
   
  
});


// ==========================================================================================================================================






app.get("/new",isLoggedIn,function(req,res){
    res.render("new.ejs" ,{currentUser:req.user});
      
});


// =========================================================================================================





// ========================================================================================================



  
  


    app.post("/blogs", upload.single("image"), async (req, res) => {
        try {
          // Upload image to cloudinary
          const result = await cloudinary.uploader.upload(req.file.path);
          console.log(result.secure_url);
      
          // Create new blog
          let blog = new Blog({
            name: req.body.name,
            author:{
                 id:req.user._id,
                 username:req.user.username
             },
           description: req.body.description,
           img: result.secure_url,
        });
          // Save blog
          await blog.save();
          req.flash("success","Successfuly Created Blog");
   
          res.redirect("/blogs");
        } catch (err) {
            req.flash("error",err.message);
          console.log(err);
        }
      });

  
  
  
//   });
  
  
  
  



  
      
// ==========================================================================================================================================
// ==========================================================================================================================================
// ==========================================================================================================================================

const storageV = multer.diskStorage({
    //destination for files
    //add back the extension
    filename: function (request, file, callback) {
      callback(null, Date.now() + file.originalname);
    },
  });
  
  //upload parameters for multer
  const uploadV = multer({
    storage: storageV,
    // limits: {
    //   fieldSize: 1024 * 1024 * 3,
    // },
  });

//upload parameters for multer


app.get("/upload",function(req,res){
      res.render("upload.ejs"); 
});








app.post("/upload-video", uploadV.single('video'), async (request, responce)=> {
    try {

        // const result = await cloudinary.uploader.upload_large(request.file.path, { resource_type: "video"});
        // console.log(result);
        
         cloudinary.uploader.upload_large(request.file.path,function(result) {
            var url=result.secure_url;

            let video = new Video({
                   filePath:url,
                   title: request.body.title,
                   description: request.body.description,
                   author:{
                    id:request.user._id,
                    username:request.user.username
                },
                });
                 video.save();
                  request.flash("success","Successfuly Uploaded Video");

                  responce.redirect("/watch");


             },{ resource_type: "video" });
    

           
        } catch (err) {
                    request.flash("error",err.message);
                console.log(err);
                }
});
app.get("/watch", (req,res)=>{
        Video.find({}, (err,videos)=>{
            res.render("watch.ejs",{videos:videos})
        })
});


app.delete("/delete-video/:id", function (req, res) {
    // if (request.session.user_id) {
        // Video.findOne({
             
        //         "watch": parseInt(request.query.v)
        // }, function (error1, video) {
        //     if (video == null) {
        //         result.render("404", {
        //             "isLogin": true,
        //             "message": "Sorry, you do not own this video."
        //         });
        //     } else {
        //         Video.findOne({
        //             "_id": ObjectId(video._id)
        //         }, function (error3, videoData) {
        //             fileSystem.unlink(videoData.filePath, function (errorUnlink) {
        //                 if (errorUnlink) {
        //                     console.log(errorUnlink);
        //                 }

        //                 Video.remove({
        //                     $and: [{
        //                         "_id": ObjectId(video._id)
        //                     }, {
        //                         "user._id": ObjectId(request.session.user_id)
        //                     }]
        //                 });
        //             });
        //         });

        //     }
        // });

        
            Video.findByIdAndDelete(req.params.id,function(err){
                if(err){
                    req.flash("error",err.message);
                    res.redirect("/blogs");
                }else{
                    req.flash("success","Successfully deleted Video");
                    res.redirect("/watch");
                };
            });

        

});






// ==========================================================================================================================================
// ==========================================================================================================================================
// ==========================================================================================================================================
      


// =============================================================================================

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



// UPDATE AND DESTROY RUOTES===============================================
app.get("blogs/edit/:id/",isLoggedIn,checkOwnership,function (req,res){
  
    Blog.findById(req.params.id, function(err,foundBlog){
        if(err){
            req.flash("error","You can only edit your posts");
            res.redirect("/blogs");
        }else{
              res.render("edit.ejs",{blog:foundBlog});
           }; 
        })
});



// COMMENTS nested Routes


app.post("/blogs/:id/comments",isLoggedIn,function(req,res){
     Blog.findById(req.params.id, function(err,blog){
          if(err){
              console.log(err)
          }else{
            var text=req.body.text;
            var author={
                id:req.user._id,
                username:req.user.username
            }
            var comment= {text:text,author:author};

            Comment.create(comment, function(err,comment){
                if(err){
                    console.log(err)
                }else{
                   blog.comments.push(comment);
                   blog.save();
                   req.flash("success", "Reviews Updated");  
                   res.redirect("/blogs/"+req.params.id);
                };
            });
          };
     });
});

app.get("/blogs/:id/comments/new",isLoggedIn, function(req,res){
    Blog.findById(req.params.id, function(err,blog){
        if(err){
            console.log(err)
        }else{
            res.render("commentsNew.ejs" ,{blog:blog, currentUser:req.user});
        };
   });
      
})







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



// UPDATE AND DESTROY RUOTES===============================================

// =============================================================================================




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

app.listen(80, function(){
    console.log("App Has Started!!!! on port 80");
});
