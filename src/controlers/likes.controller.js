import asyncHandler from "../utils/asynchandler.js"
import {ApiError} from "../utils/ApiErrors.js"
import { Likes } from "../models/likesModel/likes.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleVideoLikes = asyncHandler(async(req, res)=>{

    const {videoId} = req.params;

    if(!videoId){
        throw new ApiError(401,"Video Id is required")
    }

    const existingLike  = await Likes.findOne({
        likeBy: req.user?._id,
        video: videoId
     })
     console.log("User Id",req.user?._id)
     console.log("video Id",videoId)
     console.log("existing Like",existingLike)

     let isLiked;

     if(existingLike ){
      await Likes.deleteOne({ _id: existingLike._id})
      isLiked = false
     }else{
      const like =  await Likes.create({
            likeBy:req.user?._id,
            video:videoId

        })
        isLiked = true;

        if(!like){
            throw new ApiError(401,"Error occuring while liked.")
        }
     }
     return res.status(200).json(new ApiResponse(200, {isLiked},"Like status updated successfully."))

})

export{
    toggleVideoLikes,
}