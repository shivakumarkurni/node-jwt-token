var express= require("express");
var app=express();
var bodyParser=require("body-parser")
var mongoose=require("mongoose");
var jwt=require("jsonwebtoken");
var morgan=require("morgan");
var router=express.Router();

var webConfig=require("./config");
var User=require("./models/user")

app.use(morgan('dev'));
app.set('secretKey',webConfig.SECRET);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}))

console.log(app.get('secretKey'))

mongoose.connect(webConfig.DATABASECON,function(){
	console.log("Successfully connected to database")
})

router.get("/",function(request,response){
	response.send("This is my jwt authentication app")
});


router.get("/getUser/:name",function(request,response){
	var userName=request.params.name;
	User.getUserByName(userName,function(err,data){
		if(err){
			throw err;
		}
		response.json(data)
	})
});



router.post("/createUser",function(request,response){
var userObj=request.body;
User.createUser(userObj,function(err,data){
	if(err){
		throw err;
	}
	response.json(data)
});

})


router.post("/authenticate",function(request,response){
	var username=request.body.name;
	var password=request.body.password;

	User.getUserByName(username,function(err,user){
		if(err){
			throw err;
		}
		if(!user){
			response.json({
				success:false,
				message:"authentication failed,user not found"
			})
		}
		else if(user){
			if(user.password!=password){
				response.json({
					success:false,
					message:"authentication failed,password is incorrect"
				})
			}
			else{
			var token=jwt.sign(user,app.get('secretKey'))
			response.json({
				success:true,
				message:"Here is your token",
				token:token
			})
			}
		}
	});

})

router.use(function(request,response,next){
  var token=request.body.token
            ||request.query.token
            ||request.headers["x-access-token"]

       if(token){
           jwt.verify(token,app.get('secretKey'),function(err,decoded){
           	if(err){
           		response.json({
           			success:false,
           			message:"Authentication failed,not a valid token"
           		});
           	}
           	request.decoded=decoded;
           	next();
           })
       }
       else{
           response.status(403).send({
           	success:false,
           	message:"please provide a token"
           })
       }
});

router.get("/getUsers",function(request,response){
	User.getUsers(function(err,data){
		if(err){
			throw err;
		}
		response.json(data)
	})
})







app.use("/api",router);

var PORT=process.env.PORT||1337;

app.listen(PORT,function(){
	console.log("server is listening the port at:"+PORT)
})