import asyncHandler from "../utils/asynchandler.js"
import {ApiError} from '../utils/ApiErrors.js'
import {UploadonCloudinary} from'../utils/cloudinary.js'
import {User} from '../models/userModel/user.model.js'
import { Video } from "../models/videoModel/video.model.js"
import {ApiResponse} from '../utils/ApiResponse.js'
import mongoose , {isValidObjectId} from 'mongoose';

// Upload Video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description , isPublished} = req.body 
    if([title , description].some(fileds => fileds.trim() === "")){
        throw new ApiError(401,"All Fields are required.")
    }
    if(!req.files || !req.files.thumbnail || !req.files.thumbnail.length === 0){
        throw new ApiError(401,"Thumnail field is required.")
    }

    if(!req?.files || !req?.files?.userVideoFile || !req?.files?.userVideoFile?.length === 0){
        throw new ApiError(401,"User video file field is required.")
    }

    const uservideoLocalPath = req?.files?.userVideoFile?.[0].path;
    const thumbnailLocalPath = req?.files?.thumbnail?.[0].path;

    if(!uservideoLocalPath){
        throw new ApiError(400,"User video file field is required.")
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumnail field is required.")
    }

    const userVideoFileCloudPath = await UploadonCloudinary(uservideoLocalPath);
    const ThumnailCloudPath = await UploadonCloudinary(thumbnailLocalPath);

    if(!userVideoFileCloudPath){
        throw new ApiError(400,"User video file field is required.")
    }
    if(!ThumnailCloudPath){
        throw new ApiError(400,"Thumnail field is required.")
    }

    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(400,"User id does not exist.")
    }
  
    const videodetails = await Video.create({
        title,
        description,
        thumbnail:ThumnailCloudPath.url,
        userVideoFile:userVideoFileCloudPath.url,
        duration:userVideoFileCloudPath?.duration,
        isPublished,
        views:0,
        onwer:user?._id,
    })
    
    const aggrigateVideo = await Video.aggregate([
        {$match:{_id:videodetails?._id}},
        {
            $lookup:{
                from:"users",
                localField:"onwer",
                foreignField:"_id",
                as:"ownerDetails"
            }
        },
        {
            $unwind:"$ownerDetails"
        },
        {
            $project:{
                title:1,
                description:1,
                thumbnail: 1,
                userVideoFile: 1,
                duration: 1,
                views:1,
                isPublished: 1,
                "ownerDetails.userName":1,
                "ownerDetails.email":1,
                "ownerDetails.avatar":1,
                "ownerDetails.createdAt":1,
            }
        }
    ])
    return res.status(200)
    .json(new ApiResponse(200, aggrigateVideo ,"Video upload successfully."))
})

// Views Counts
const incrementVideoViews = asyncHandler(async (req,res)=>{
    const {videoId} = req.params;
    if(!videoId || !isValidObjectId(videoId)){
     throw new ApiError(400, "Video id is required.")
    }

    const updateVideo = await Video.findByIdAndUpdate(
        videoId,
        {$inc:{views:1}},
        {new:true}
    )

    if(!updateVideo){
        throw new ApiError(404, "Video not found.")
    }

    const aggrigateVideo = await Video.aggregate([
        {$match:{_id:updateVideo?._id}},
        {
            $lookup:{
                from:"users",
                localField:"onwer",
                foreignField:"_id",
                as:"ownerDetails"
            }
        },
        {
            $unwind:"$ownerDetails"
        },
        {
            $project:{
                title:1,
                description:1,
                thumbnail: 1,
                userVideoFile: 1,
                duration: 1,
                isPublished: 1,
                views:1,
                "ownerDetails.userName":1,
                "ownerDetails.email":1,
                "ownerDetails.avatar":1,
                "ownerDetails.createdAt":1,
            }
        }
    ])

    if(!aggrigateVideo.length){
        throw new ApiError(404, "Video not found.")
    }

    return res.status(200)
    .json(new ApiResponse(200, aggrigateVideo , "Video view count updated successfully."))
})

// toggle Publish Status
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!videoId){
        throw new ApiError(400, "Video id is required.")
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(400, "Video not found.")
    }

    let isPublishedVideo;
    if(video.isPublished){
        isPublishedVideo = false;
    }else{
        isPublishedVideo = true;
    }

    const updateVideo = await Video.findByIdAndUpdate(
        videoId,
        {isPublished:isPublishedVideo}
    )
    if(!updateVideo){
        throw new ApiError(404, "Video not found.")
    }

    return res.status(200)
    .json(new ApiResponse(200, updateVideo , "Video toggle successfully."))

})

// Get all Videos
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10,  sortBy, sortType, userId , title , description } = req.query;
    const query ={};
    if(title){
        query.title = { $regex: title, $options: "i" }; // Case-insensitive search on the title
    }

    if(description){
        query.title = { $regex: description, $options: "i" }; 
    }

    const sortOrder = {};
    if (sortBy && sortType) {
        sortOrder[sortBy] = sortType === "desc" ? -1 : 1;
    }

    // Pagination calculations
    const skip = (Number(page) - 1) * Number(limit);
    console.log(skip)

    // Fetch filtered, sorted, and paginated data


    // const videos = await Video.find(query)
    //        .sort(sortOrder)
    //        .skip(skip)
    //        .limit(Number(limit));

    // Build the aggregation pipeline
    const videos = await Video.aggregate([
     // Match stage for filtering based on query
     { $match: query }, 
    
     {
        $lookup: {
            from: "users", // The name of the User collection
            localField: "onwer", // The field in Video collection
            foreignField: "_id", // The field in User collection
            as: "ownerDetails" // The alias for the joined data
        }
     },
    
     // Unwind the ownerDetails array to simplify the structure
     { $unwind: { path: "$ownerDetails", preserveNullAndEmptyArrays: true } },
    
     // Add a project stage to control the fields returned
     {
        $project: {
            title: 1,
            description: 1,
            thumbnail: 1,
            userVideoFile: 1,
            duration: 1,
            isPublished: 1,
            "ownerDetails.userName": 1, // Select specific owner fields
            "ownerDetails.email": 1,
            "ownerDetails.avatar": 1,
            "ownerDetails.createdAt": 1,
        }
     },
    
     // Sort stage for sorting
     { $sort: sortOrder },
    
     // Skip stage for pagination
     { $skip: skip },
    
     // Limit stage for pagination
     { $limit: Number(limit) }
    ]);
       // Get total count for pagination metadata
       const totalVideos = await Video.countDocuments(query);
   
       // Response with data and metadata
       return res.status(200).json(
           new ApiResponse(200, {
               videos,
               pagination: {
                   currentPage: Number(page),
                   totalPages: Math.ceil(totalVideos / limit),
                   totalVideos,
               },
           }, "Videos fetched successfully.")
    );
})

// Get Video by Id
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!videoId){
        throw new ApiError(400, "Video id is required.")
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(400, "Video not found.")
    }

    const aggrigateVideo = await Video.aggregate([
        {$match:{_id:video._id}},
        {
            $lookup:{
                from:"users",
                localField:"onwer",
                foreignField:"_id",
                as:"ownerDetails"
            }
        },
        {
            $unwind:"$ownerDetails"
        },
        {
            $project:{
                title:1,
                description:1,
                thumbnail: 1,
                userVideoFile: 1,
                duration: 1,
                isPublished: 1,
                views:1,
                "ownerDetails.userName":1,
                "ownerDetails.email":1,
                "ownerDetails.avatar":1,
                "ownerDetails.createdAt":1,
            }
        }
    ])

    if(!aggrigateVideo.length){
        throw new ApiError(404, "Video not found.")
    }

    return res.status(200)
    .json(new ApiResponse(200, aggrigateVideo , "Data fetched successfully."))

})

// Get Video by Id
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.query
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "Video id is required.")
    }

    const video = await Video.deleteOne({_id:videoId});
    if(!video){
        throw new ApiError(400, "Video not found.")
    }

    return res.status(200)
    .json(new ApiResponse(200, [] , "Video delete successfully."))
})

// Update Video Thumbnail
const updateVideoThumbnail = asyncHandler(async (req, res) => {
    const { videoId } = req.body;
    const localThumbnailPath = req.file?.path

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "Video id is required.")
    }

    if(!localThumbnailPath){
        throw new ApiError(400,"Thumbnail field is required.")
    }

    const thumbnail = await UploadonCloudinary(localThumbnailPath)
    if(!thumbnail){
        throw new ApiError(500, "Error while uploading on Thumbnail.")
    }
    const thumbNail = await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                thumbnail : thumbnail.url
            }
        },
        { new: true, validateBeforeSave: false }
    ).select("-title -userVideoFile -description -duration -isPublished -onwer -views -usevideoFile")
  
     if (req.thumbNail?.thumbnail) {
        const publicUid = getPublicIdFromUrl(req.thumbNail.thumbnail);
        try {
            const deleteFile = await deleteCloudinariyFile(publicUid);
        } catch (error) {
            console.error("Error deleting previous thumbnail:", error.message);
        }
    }
    return res.status(200).json(new ApiResponse(200, thumbNail , "Thumbnail is updated successfully."))
})

// Update Video Thumbnail
const updateVideo  = asyncHandler(async (req, res) => {
    const { videoId , isPublished , title , description } = req.body;
    
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "Video id is required.")
    }

    if(!title){
        throw new ApiError(400, "Title field is required.")  
    }
    if(!description){
        throw new ApiError(400, "Description field is required.")  
    }
   
    const video = await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                title,
                description,
                isPublished,
            }
        },
        { new: true, validateBeforeSave: false }
    )

    if(!video){
        throw new ApiError(500, "Error Occurr while video updating.")  
    }
    return res.status(200).json(new ApiResponse(200, video , "Video is updated successfully."))
})


export {
    publishAVideo, 
    incrementVideoViews,
    togglePublishStatus,
    getAllVideos,
    getVideoById,
    deleteVideo,
    updateVideoThumbnail,
    updateVideo ,
}