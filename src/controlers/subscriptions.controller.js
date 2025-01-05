import mongoose , {isValidObjectId} from 'mongoose';
import Subscription from '../models/subscriptionModel/subscription.model.js'
import asynchandler from '../utils/asynchandler.js'
import {ApiError} from '../utils/ApiErrors.js'
import {User}  from '../models/userModel/user.model.js'
import {ApiResponse} from '../utils/ApiResponse.js'

const toggleSubscription = asynchandler ( async(req, res)=>{
 const {channelId} = req.params

 if(!channelId || !isValidObjectId(channelId)){
    throw new ApiError(400,"Invalid or missing channel Id.")
 }

 const channel = await User.findById(channelId)
 if(!channel){
    throw new ApiError(400,"Channel does not exist.")
 }

 const existingSubscription = await Subscription.findOne({
    subscriber:req.user?._id,
    channel:channelId
 })
let isSubscribed ;
 if(existingSubscription){
   await Subscription.deleteOne({_id:existingSubscription?._id})
   isSubscribed = false
 }else{
  await Subscription.create({
    subscriber:req.user?._id,
    channel:channelId
  })
  isSubscribed = true
 }

 let response = {
    channelId,
    userName:channel?.userName,
    email:channel?.email,
    isSubscribed
 }



 return res.status(200)
 .json(new ApiResponse(200, response , "Successfully toggled subscription."))

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asynchandler(async (req, res) => {
   const {channelId} = req.params;
   if(!channelId || !isValidObjectId(channelId)){
      throw new ApiError(400,"Invalid or missing channel Id.")
   }
  
   const channel = await User.findById(channelId)
   if(!channel){
      throw new ApiError(400,"Channel does not exist.")
   }
  
   const subscriberList = await Subscription.aggregate([
      {
         $match: {
            channel: new mongoose.Types.ObjectId(channelId),
         }
     },
     {
      $lookup:{
         localField:"subscriber",
         from:"users",
         foreignField:"_id",
         as:"channelDetails"
      }
     },
      {
         $unwind: "$channelDetails", 
       },
      {
         $project:{
            channel:1,
            subscriber:1,
            "channelDetails.fullName":1,
            "channelDetails.email":1,
            "channelDetails.avatar":1,
         }
     },
   ])
   
   if(!subscriberList.length){
      throw new ApiError(404,"No Subscriber Found.")
   }

   res.status(200)
   .json(new ApiResponse(200, subscriberList ,"Subscriber list fetched successfully."))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asynchandler(async (req, res) => {
   const { subscriberId } = req.params
   if(!subscriberId || !isValidObjectId(subscriberId)){
      throw new ApiError(400,"Invalid or missing subscriber Id.")
   }
  
   const subscriber  = await User.findById(subscriberId)
   if(!subscriber ){
      throw new ApiError(404,"Subscriber not found.")
   }

   const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
         subscriber: new mongoose.Types.ObjectId(subscriberId),
     },
    },
    {
      $lookup: {
         from: "users", // Collection to join
         localField: "channel", // Field in Subscription
         foreignField: "_id", // Field in User
         as: "channelDetails", // Alias for the joined data
      },
   },
   {
      $unwind: "$channelDetails", // Flatten the array
   },
    {
      $project:{
         channel:1,
            subscriber:1,
            "channelDetails.fullName":1,
            "channelDetails.email":1,
            "channelDetails.avatar":1,
            "channelDetails.createdAt": 1, 
      }
    }
   ])

   if(!subscribedChannels.length){
     throw new ApiError(404,"No subscribed channels found.")
   }

   return res.status(200)
   .json(new ApiResponse(200,  subscribedChannels, "Successfully fetched data."))
})

export{
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}