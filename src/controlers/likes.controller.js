import asyncHandler from "../utils/asynchandler.js"
import {ApiError} from "../utils/ApiErrors.js"
import { Likes } from "../models/likesModel/likes.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose , {isValidObjectId} from 'mongoose';

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

const toggleCommentLikes = asyncHandler(async(req, res)=>{

    const {commentId} = req.params;

    if(!commentId){
        throw new ApiError(401,"Video Id is required")
    }

    const existingLike  = await Likes.findOne({
        likeBy: req.user?._id,
        comment: commentId
     })
     console.log("User Id",req.user?._id)
     console.log("comment Id",commentId)
     console.log("existing Like",existingLike)

     let isLiked;

     if(existingLike ){
      await Likes.deleteOne({ _id: existingLike._id})
      isLiked = false
     }else{
      const like =  await Likes.create({
            likeBy:req.user?._id,
            comment:commentId
        })
        isLiked = true;

        if(!like){
            throw new ApiError(401,"Error occuring while liked.")
        }
     }
     return res.status(200).json(new ApiResponse(200, {isLiked},"Like status updated successfully."))

})

// controller to return Like list of a channel
const getUserChannelLikes = asyncHandler(async (req, res) => {
   const { id } = req.params;
   const userId = req.user?.id; // Ensure this is correctly retrieved

   if (!id || !isValidObjectId(id)) {
       throw new ApiError(400, "Invalid or missing channel ID.");
   }

   // Fetch Like count
   const likeCount = await Likes.countDocuments({ video: id });
   console.log("likeCount",likeCount)
   // Check if user is Liked
   let isLiked = false;
   console.log("User Id ", userId ,"Videoid " , id)
   if (userId) {
       const like = await Likes.findOne({ video: id, likeBy: userId });
       console.log("Like record:", like); // Debugging

       isLiked = !!like; // Convert object to boolean
   }

   res.status(200).json(
       new ApiResponse(200, { count: likeCount, isLiked }, "Like data fetched successfully.")
   );
});

export{
    toggleVideoLikes,
    getUserChannelLikes,
    toggleCommentLikes,
}