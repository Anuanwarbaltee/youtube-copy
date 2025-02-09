import {playlist} from '../models/playListModel/playList.model.js'
import asyncHandler from '../utils/asynchandler.js'
import {ApiError} from '../utils/ApiErrors.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import mongoose , {isValidObjectId} from 'mongoose';
import { Video } from '../models/videoModel/video.model.js';

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body;
    const userId = req.user?._id;
    if([name,description].some(item => item?.trim() === "")){
     throw new ApiError(400,"All fields are required.")
    }

    if (!userId) {
      throw new ApiError(401, "User authentication required.");
  }
    const playList = await playlist.create({
     name:name,
     description:description,
    owner: new mongoose.Types.ObjectId(userId)
    })

    if(!playList){
        throw new ApiError(401,"Error occur while creating playlist.")
    }

   return res.status(200)
    .json(new ApiResponse(200,{},"Playlist create successfully."))
})

const getUserPlayList = asyncHandler(async (req , res) =>{
  const {userId} = req.params;

     
  if(!userId || !isValidObjectId(userId)){
    throw new ApiError(400,"User not found")
  }

  const playList = await playlist.find({owner: new mongoose.Types.ObjectId(userId)})

  if(!playList){
    throw new ApiError(404,"No playList found for this user.")

  }

return res.status(200)
.json(new ApiResponse(200,playList,"Playlist fetch successfully."))
  console.log(first)
})

const getPlaylistById = asyncHandler(async (req, res) => {

    const {playListId} = req.params;
       console.log("test playlist by id", playListId)
      if(!playListId || !isValidObjectId(playListId)){
        throw new ApiError(400,"User Id is required.")
      }

      const playList = await playlist.findById(playListId)

      console.log("data", playList)

      if(!playList){
        throw new ApiError(200,"No playList found.")

      }

   return res.status(200)
    .json(new ApiResponse(200,playList,"Playlist fetch successfully."))
      console.log(first)
})

const addVideoToPlayList = asyncHandler(async (req, res) =>{

  const {playListId,vedioId} = req.params;

  const existVideo = await Video.findById(vedioId);

  if(!existVideo){
    throw new ApiError(404,"Video not found")
  }

  const existPlayList = await playlist.findById(playListId);

  if(!existPlayList){
    throw new ApiError(404,"Playlist not found")
  }

  const updatePlayList = await playlist.updateOne(
    {_id:playListId},
    {$addToSet:{videos:vedioId}}
  )

  if(!updatePlayList){
    throw new ApiError(404,"Playlist not found")
  }

  res.status(200)
  .json(new ApiResponse(200, updatePlayList , "Add Video in the Playlsit  successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res)=>{
  const {playListId, vedioId} = req.params;
  if(!playListId){
    throw new ApiError(401,"Playlist  id is required")
  }
  if(!vedioId){
    throw new ApiError(401,"Video  id is required")
  }
  
  const playList = await playlist.deleteOne({owner: new mongoose.Types.ObjectId(userId)})

  if(!playList){
    throw new ApiError(401,"Playlist  not found")
  }

  res.status(200)
  .json(new ApiResponse(200,[],"Playlist delete successfully"))
})

const deletePlaylist = asyncHandler(async (req, res)=>{
  const {playListId} = req.params;
  if(!playListId){
    throw new ApiError(401,"Playlist  id is required")
  }
  const playList = await playlist.deleteOne(playListId)

  if(!playList){
    throw new ApiError(401,"Playlist  not found")
  }

  res.status(200)
  .json(new ApiResponse(200,[],"Playlist delete successfully"))
})

export {
    createPlaylist,
    getUserPlayList,
    getPlaylistById,
    addVideoToPlayList,
    deletePlaylist,
    removeVideoFromPlaylist,
}