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
   // Check if user is Liked
   let isLiked = false;
   if (userId) {
       const like = await Likes.findOne({ video: id, likeBy: userId });

       isLiked = !!like; 
   }

   res.status(200).json(
       new ApiResponse(200, { count: likeCount, isLiked }, "Like data fetched successfully.")
   );
});

const geLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid or missing user ID.");
  }

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $match: {
        likeBy: new mongoose.Types.ObjectId(userId),
      },
    },

    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $project: {
              title: 1,
              thumbnail: 1,
              uservideoFile: 1,
              description: 1,
              createdAt: 1,
              views: 1,
            },
          },
        ],
      },
    },

    {
      $unwind: "$video", // 
    },
    {
      $replaceRoot: {
        newRoot: "$video",
      },
    },

    { $sort: { createdAt: -1 } },

    // pagination
    { $skip: skip },
    { $limit: limit },
  ];

  const videos = await Likes.aggregate(pipeline);

  // total count for frontend
  const totalCount = await Likes.countDocuments({
    likeBy: userId,
  });

  res.status(200).json(
    new ApiResponse(200, {
      videos,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalRecords: totalCount,
        hasMore: skip + videos.length < totalCount,
      },
    }, "Liked videos fetched successfully.")
  );
});


export{
    toggleVideoLikes,
    getUserChannelLikes,
    toggleCommentLikes,
    geLikedVideos,
}