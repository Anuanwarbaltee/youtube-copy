import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
const userSchema = new Schema({
    userName:{
        type:String,
        unique:true,
        required:true,
        trim:true,
        lowercase:true,
        index:true,
    },
    email:{
        type:String,
        unique:true,
        required:true,
    },
    fullName:{
        type:String,
        required:true,
        index:true,
    },
    password:{
        type:String,
        required:true,
    },
    coverImage:{
        type:String,
    },
    avatar:{
        type:String,
        required:true,
    },
    watchHistory:[{
        type:Schema.Types.ObjectId,
        ref:"video"
    }],
    refreshToken:{
        type:String
    }
    
},{
    timestamps:true,
})

userSchema.pre("save", async function (next){
    if(!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 12)
    next()
})

userSchema.methods.isPasswordCorrect =  async function (password) {
return await bcrypt.compare(password, this.password)
}

userSchema.methods.gnerateAccessToken = function (){
   return jwt.sign(
        {
            _id:this._id,
            userName:this.userName,
            fullName:this.fullName,
            email:this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.gnerateRefreshToken = function (){
    return jwt.sign(
         {
             _id:this._id,
         },
         process.env.REFRESH_TOKEN_SECRT,
         {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
         }
     )
 }

const User = mongoose.model("Users", userSchema)

export {User}