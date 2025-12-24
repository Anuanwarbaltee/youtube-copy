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
   const { channelId } = req.params;
   const userId = req.user?.id;

   console.log("channel Id" , channelId , "User Id" , userId)

   if (!channelId || !isValidObjectId(channelId)) {
       throw new ApiError(400, "Invalid or missing channel ID.");
   }

   // Fetch subscriber count
   const subscriberCount = await Subscription.countDocuments({ channel: channelId });
   // Check if user is subscribed
   let isSubscribed = false;
   if (userId) {
       const subscription = await Subscription.findOne({ channel: channelId, subscriber: userId });
       isSubscribed = !!subscription; // Convert object to boolean

   }

   res.status(200).json(
       new ApiResponse(200, { count: subscriberCount, isSubscribed }, "Subscriber data fetched successfully.")
   );
});



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

const getSubscribedChannelsWithLatestVideo = asynchandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const data = await Subscription.aggregate([
        //  Match user subscriptions
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(userId),
            },
        },

        //  Get channel (user) info
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            userName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                channel: { $first: "$channel" },
            },
        },

        // Get latest video of that channel
        {
            $lookup: {
                from: "videos",
                localField: "channel._id",
                foreignField: "owner",
                as: "latestVideo",
                pipeline: [
                    { $sort: { createdAt: -1 } },
                    { $limit: 1 },
                    {
                        $project: {
                            title: 1,
                            thumbnail: 1,
                            uservideoFile:1,
                            description:1,
                            createdAt: 1,
                            views: 1,
                        },
                    },
                ],
            },
        },

        {
            $addFields: {
                latestVideo: { $first: "$latestVideo" },
            },
        },

        // 4️⃣ Sort by latest video date
        {
            $sort: {
                "latestVideo.createdAt": -1,
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            data,
            "Subscribed channels with latest videos fetched successfully."
        )
    );
});


export{
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    getSubscribedChannelsWithLatestVideo
}