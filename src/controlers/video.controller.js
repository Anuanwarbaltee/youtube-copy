import asyncHandler from "../utils/asynchandler.js"
import {ApiError} from '../utils/ApiErrors.js'
import {deleteCloudinariyFile, getPublicIdFromUrl, UploadonCloudinary} from'../utils/cloudinary.js'
import {User} from '../models/userModel/user.model.js'
import { Video } from "../models/videoModel/video.model.js"
import {ApiResponse} from '../utils/ApiResponse.js'
import mongoose , {isValidObjectId} from 'mongoose';

// Upload Video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description , isPublished} = req.body 
    if([title , description].some(fileds => fileds?.trim() === "")){
        throw new ApiError(400,"All Fields are required.")
    }
    if(!req.files || !req.files.thumbnail ){
        throw new ApiError(400,"Thumnail field is required.")
    }

    console.log("request file" , req?.files)

    if(!req?.files || !req?.files?.uservideoFile ){
        throw new ApiError(400,"User video file field is required.")
    }

    const uservideoLocalPath = req?.files?.uservideoFile?.[0].path;
    const thumbnailLocalPath = req?.files?.thumbnail?.[0].path;

    console.log("uservideoLocalPath", uservideoLocalPath)

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
        uservideoFile:userVideoFileCloudPath.url,
        duration:userVideoFileCloudPath?.duration,
        isPublished,
        views:0,
        owner:user?._id,
    })
    
    const aggrigateVideo = await Video.aggregate([
        {$match:{_id:videodetails?._id}},
        {
            $lookup:{
                from:"users",
                localField:"owner",
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
                uservideoFile: 1,
                duration: 1,
                owner:1,
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
                localField:"owner",
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
                uservideoFile: 1,
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
  const { page = 1, limit = 10, sortBy, sortType, search } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  let pipeline = [];

  pipeline.push({
  $match: {
    isPublished: true,
  },
 });

  //  Lookup users
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "ownerDetails",
    },
  });

  //  Unwind owner
  pipeline.push({
    $unwind: {
      path: "$ownerDetails",
      preserveNullAndEmptyArrays: true,
    },
  });

  //  Single search filter (title + description + username)
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { "ownerDetails.userName": { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  //  Project required fields
  pipeline.push({
    $project: {
      title: 1,
      description: 1,
      thumbnail: 1,
      uservideoFile: 1,
      duration: 1,
      isPublished: 1,
      views: 1,
      createdAt: 1,
      ownerDetails: {
        _id: 1,
        userName: 1,
        email: 1,
        avatar: 1,
        createdAt: 1,
      },
    },
  });

  //  Sorting
  let sortStage = {};
  if (sortBy && sortType) {
    sortStage[sortBy] = sortType === "desc" ? -1 : 1;
  } else {
    sortStage.createdAt = -1; // default
  }

  pipeline.push({ $sort: sortStage });

  //  Pagination
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: Number(limit) });

  const videos = await Video.aggregate(pipeline);

  // 7 Total count for pagination
  const countPipeline = pipeline.filter(
    stage => !stage.$skip && !stage.$limit && !stage.$sort
  );

  countPipeline.push({ $count: "total" });

  const totalCount = await Video.aggregate(countPipeline);
  const totalVideos = totalCount[0]?.total || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalVideos / limit),
          totalVideos,
        },
      },
      "Videos fetched successfully"
    )
  );
});

// Get Video by Id
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.id);

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
                localField:"owner",
                foreignField:"_id",
                as:"ownerDetails"
            }
        },
        {
            $unwind:"$ownerDetails"
        },
        {
          $addFields: {
            isOwner: { $eq: ["$owner", userId] }
          }
        },
          {
            $project:{
                title:1,
                description:1,
                thumbnail: 1,
                uservideoFile: 1,
                duration: 1,
                isPublished: 1,
                views:1,
                createdAt:1,
                isOwner:1,
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

const getChanalVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, id } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const pipeline = [];

  pipeline.push({
    $match: {
      owner: new mongoose.Types.ObjectId(id),
    },
  });

  // Search filter (title + description)
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  // Projection
  pipeline.push({
    $project: {
      title: 1,
      description: 1,
      thumbnail: 1,
      isPublished: 1,
      uservideoFile: 1,
      duration: 1,
      views: 1,
      createdAt: 1,
      
    },
  });

  // Sort latest first
  pipeline.push({ $sort: { createdAt: -1 } });

  // Pagination
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: Number(limit) });

  const videos = await Video.aggregate(pipeline);

  // Count for pagination
  const countPipeline = pipeline.filter(
    stage => !stage.$skip && !stage.$limit && !stage.$sort
  );

  countPipeline.push({ $count: "total" });

  const totalCount = await Video.aggregate(countPipeline);
  const totalVideos = totalCount[0]?.total || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalVideos / limit),
          totalVideos,
        },
      },
      "Videos fetched successfully"
    )
  );
});


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

    const thumbnail = await UploadonCloudinary(localThumbnailPath,   req.file?.mimetype)
    if(!thumbnail){
        throw new ApiError(500, "Error while uploading on Thumbnail.")
    }
    const oldVideo = await Video.findById(videoId);

    const thumbNail = await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                thumbnail : thumbnail.url
            }
        },
        { new: true, validateBeforeSave: false }
    ).select("-title -uservideoFile -description -duration -isPublished -owner -views -usevideoFile")
  
    

    if (oldVideo?.thumbnail) {
     const publicUid = getPublicIdFromUrl(oldVideo.thumbnail);
     await deleteCloudinariyFile(publicUid);
    }
    return res.status(200).json(new ApiResponse(200, thumbNail , "Thumbnail is updated successfully."))
})

// Update Video File
const updateVideoFile = asyncHandler(async (req, res) => {
    const { videoId } = req.body;
    const localFilePath = req.file?.path

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "Video id is required.")
    }

    if(!localFilePath){
        throw new ApiError(400,"Video field is required.")
    }

    const cloudinaryFilePath = await UploadonCloudinary(localFilePath,   req.file?.mimetype)
    if(!cloudinaryFilePath){
        throw new ApiError(500, "Error while uploading on Video.")
    }
    const oldVideo = await Video.findById(videoId);
    
    const videoFile = await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                uservideoFile : cloudinaryFilePath.url
            }
        },
        { new: true, validateBeforeSave: false }
    ).select("-title -thumbnail -description -duration -isPublished -owner -views -usevideoFile")
  
    

    if (oldVideo?.uservideoFile) {
     const publicUid = getPublicIdFromUrl(oldVideo.uservideoFile);
     await deleteCloudinariyFile(publicUid,"video");
    }
    return res.status(200).json(new ApiResponse(200, videoFile , "Thumbnail is updated successfully."))
})

// Update Video  meta data
const updateVideo  = asyncHandler(async (req, res) => {
    const { videoId , isPublished , title , description } = req.body;
    const _id = new mongoose.Types.ObjectId(videoId)

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "Video id is required.")
    }

    if(!title){
        throw new ApiError(400, "Title field is required.")  
    }
  
   
    const video = await Video.findByIdAndUpdate(_id,
        {
            $set:{
                title,
                description,
                isPublished,
            }
        },
        { new: true, validateBeforeSave: false }
    )
    console.log("check update data." , video)

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
    updateVideoFile,
    updateVideo ,
    getChanalVideos
}