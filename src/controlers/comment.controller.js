import { Comment } from "../models/commentModel/comment.model.js";
import { Video } from "../models/videoModel/video.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asynchandler.js";
import mongoose , {isValidObjectId} from 'mongoose';


const addcomment = asyncHandler(async (req, res) =>{

    const {id ,content} = req.body;

    if(!id){
         throw new ApiError("401","Id is required")
    }

    if(!content){
        throw new ApiError("401","Comment is required")
   }

const video = await Video.findById(id)
if(!video){
    throw new ApiError("401","Video not found")
}

const comment = await Comment.create({
    content:content,
    video: new mongoose.Types.ObjectId(id),
    owner: new mongoose.Types.ObjectId(req.user?._id)
}) 

console.log("user id test", req?.user?._id)
if(!comment){
    throw new ApiError(401,"Error occuring during add comment.")
}

console.log("Comment", comment)
res.status(200)
.json(new ApiResponse(200,comment,"Comment add Successfully."))
})

const getComments = asyncHandler(async (req, res)=>{
    const {skip = 0, limit = 0 , id} = req.body;
    if(!id){
        throw new ApiError("404","Video Id is requires.")
    }

    const page = (Number(skip) -1) * Number(limit);
    const comments = await Comment.aggregate([
        {
            $match:{
            video: new mongoose.Types.ObjectId(id)
            }
        },
        {$skip:page},
        {$limit:Number(limit)},
        {
          $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"ownerDetails"
          }
        },
        { $unwind: { path: "$ownerDetails", preserveNullAndEmptyArrays: true } },
        {
            $lookup:{
              from:"likes",
             let :{ comentId : "$_id"},

             pipeline:[
                {
                    $match:{
                        $expr:{
                            $eq:["$comment","$$comentId"]
                        }
                    }
                }
             ],
             as:"likeData"
              
            }
          },
        
        {
            $project:{
                content:1,
                createdAt:1,
                updatedAt:1,
                likesCount:{$size:"$likeData"},
                isLiked:{
                    $in:[new mongoose.Types.ObjectId(req?.user?._id),"$likeData.likeBy"]
                },
                "ownerDetails.userName": 1, 
                "ownerDetails.email": 1,
                "ownerDetails.avatar": 1,
                "ownerDetails._id": 1,
            }
        }
    ])

    console.log(comments)
    const totalComments = await Comment.countDocuments({video: new mongoose.Types.ObjectId(id)})

    return res.status(200).json(new ApiResponse(200, {comments,pagination:{
        currentPage:Number(skip),
        totalPages:Math.ceil(totalComments / limit),
        totalCounts:totalComments
    }} , "Comments fetched successfully."))

})

const updateComments = asyncHandler ( async (req, res) => {
    const {commentId , content} = req.body;

    if(!commentId){
        throw new ApiError(401,"Comment id is required.")
    }

    if(!content){
        throw new ApiError(401,"Comment  is required.")
    }

    console.log("comment & id", commentId , content)
    const comment = await Comment.updateOne(
        {_id:commentId},
        {$set:{content}}
    )

    if(!comment){
        throw new ApiError(401,"Error Occuring while updating comment.")
    }

    return res.status(200).json(new ApiResponse(200,{},"Comment update successfully."))
})

const deleteComment = asyncHandler (async (req, res)=>{
 const {commentId} = req.params;
 console.log("comment ID", commentId)
 if(!commentId){
    throw new ApiError(401,"Comment Id is required.")
 }

 const comment = await Comment.deleteOne( {_id:new mongoose.Types.ObjectId(commentId)})

 if(!comment){
    throw new ApiError(401,"Error occur while deleting comment.")
 }

 return res.status(200).json(new ApiResponse(200,{},"comment deleted successfully."))
})

export {
    addcomment,
    getComments,
    updateComments,
    deleteComment,
}