const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('../models/user')

 const placeSchema = new Schema({

    title : {type:String , required : true},
    description : {type:String , required : true},
    image : {type:String , required : true},
    location : {
        lat : {type : Number,required : false},
        lng : {type : Number,required : false}
    },
    creator : {type:mongoose.Types.ObjectId , required : true , ref : 'User'}

 });

 module.exports = mongoose.model('Place',placeSchema);