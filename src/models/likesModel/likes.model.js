import mongoose, { Schema } from "mongoose";

const likesSchema = new mongoose.Schema({
    video:{
        type:  Schema.Types.ObjectId,
        ref:"Video"
    },
    comment:{
        type: Schema.Types.ObjectId,
        ref:"comment"
    },
    likeBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},
{
    timestamps:true,
})

export const Likes =  mongoose.model("Likes",likesSchema)
