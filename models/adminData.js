const mongoose = require('mongoose')
const Schema = mongoose.Schema


const AdminSchema = new Schema({
    email:String,
    Password:String,
    created_at :{type:Date, required:true,default:Date.now}
},{timestamps:true})

const Admin=mongoose.model('admin',AdminSchema)
module.exports=Admin