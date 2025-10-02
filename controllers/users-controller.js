const HttpError = require('../models/http-error');
const {validationResult} = require('express-validator')
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const allUsers = async (req,res,next)=>{
    let users;
    try{
        users = await User.find({},{password : 0});//.find({},"+email,+name,+places,+image");
    }catch(err){
        return next(new HttpError("Unable to Fetch Users!",500));
    }
    res.json({users : users.map(u=> u.toObject({getters:true}))});
};

const signup = async (req,res,next)=>{
const error = validationResult(req);
    if(!error.isEmpty()){
        return next(new HttpError("Invalid Inputs Passed",422)) ;
    }
const {name,email,password} = req.body;
let existedUser;
try{
    existedUser = await User.findOne({email : email}); 
}catch(err){
    return next(new HttpError("Signup Failed, Please try Again",500));
}

if(existedUser){
    return next(new HttpError("User Exists already, try login instead",422));
}
let hashedPassword;
try {
    hashedPassword = await bcrypt.hash(password,12);
    
} catch (error) {
    const err = new HttpError('could not create user , please try again',500);
    return next(err);
}
const createdUser = new User({
    name,
    email,
    password :hashedPassword,
    places :[],
    image:req.file.path
});
try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Signup Failed!!", 500);
    return next(error);
  }
let token;
try {

    token = jwt.sign({
        userId : createdUser.id,
        email : createdUser.email
    },process.env.JWT_KEY,{expiresIn : '1h'});

} catch (error) {

    return next(new HttpError("Signup Failed, Please try Again",500));
    
}
res.status(201).json({userId : createdUser.id, email : createdUser.email, token : token});
};

const login = async (req,res,next)=>{
const {email,password} = req.body;
let existedUser ;
try{
    existedUser = await User.findOne({email : email});
}catch(err){
    return next(new HttpError("Login Failed! please try again",500));
}

if(!existedUser){
    return next(new HttpError("Login Failed! invalid credentials",422));
}
let isValidPassword = false;
try {
    isValidPassword = await bcrypt.compare(password,existedUser.password);
} catch (error) {
    const err = new HttpError("Could not log you in, please check your credentials & try again",500);
    return next(err);
}
if(!isValidPassword){
    return next(new HttpError("Login Failed! invalid credentials",422));
}
let token;
try {

    token = jwt.sign({
        userId : existedUser.id,
        email : existedUser.email
    },process.env.JWT_KEY,{expiresIn : '1h'});

} catch (error) {

    return next(new HttpError("Login Failed, Please try Again",500));
    
}
res.status(200).json({userId : existedUser.id, email : existedUser.email, token : token});
}

exports.allUsers = allUsers;
exports.signup = signup;
exports.login= login;