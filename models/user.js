const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name:String,
    phone:Number,
    email:String,
    password:String,
    block:Boolean,
    address: [{
        fname: String,
        lname: String,
        house: String,
        towncity: String,
        district: String,
        state: String,
        pincode: Number,
        email: String,
        mobile: String
    }],
    
})


const User=mongoose.model('user',UserSchema)
module.exports=User