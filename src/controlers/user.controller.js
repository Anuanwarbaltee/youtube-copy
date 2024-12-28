import asynchandler from '../utils/asynchandler.js'
import {ApiError} from '../utils/ApiErrors.js'
import {User}  from '../models/userModel/user.model.js'
import {UploadonCloudinary , deleteCloudinariyFile , getPublicIdFromUrl} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshTokens = async (userId) => {
    try {
 
        const user = await User.findById(userId)
        const accessToken = await  user.gnerateAccessToken()
        const refreshToken = await user.gnerateRefreshToken()

        user.refreshToken = refreshToken
        await  user.save({validateBeforeSave:false})
        return {accessToken , refreshToken}
    } catch (error) {
        throw new ApiError(500,error.message ||"Something went wrong while generating access and refresh tokens.")
    }
    
}

const registerUser = asynchandler (async (req, res) => {
    const {fullName, email,userName,password} = req.body;
    if([fullName,email,userName,password].some(fields => fields?.trim() === "")){
        throw new ApiError(400,"All Fields are required.");
    };

    // const existedUser = await User.findOne({$or:[{ userName }, { email }]});

    
    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    })

    if(existedUser){
        throw new ApiError(409,"User with Email or User Name already exist.");
    };
    
    if (!req.files || !req.files.avatar || req.files.avatar.length === 0) {
        throw new ApiError(400, "Avatar file is required.");
    }
    const localAvatarPath = req.files?.avatar[0].path;
    const localCoverImagePath = req.files?.coverImage?.[0]?.path;

    if(!localAvatarPath){
        throw new ApiError(400, "The avatar field is required.");
    };

   const avatorCloudPath = await UploadonCloudinary(localAvatarPath)
   const coverImageCloudPath = await UploadonCloudinary(localCoverImagePath)

   if(!avatorCloudPath){
    throw new ApiError(400, "The avatar field is required.");
    };
const user = await User.create({
    fullName,
    password,
    avatar:avatorCloudPath.url,
    coverImage:coverImageCloudPath?.url || "",
    email,
    userName: userName?.toLowerCase()
})
console.log("user ", user) 
 const createdUser = await   User.findById(user._id).select("-password -refreshToken")
 console.log("Created user ", createdUser)
 if(!createdUser){
    throw new ApiError(500, "Something went wrong while creating user.")
 }

 return res.status(201).json(new ApiResponse(200, createdUser , "User created successfully."))

})

const loginUser = asynchandler( async(req,res)=> {
 const {userName,email, password} = req.body;

 if(!userName && !email){
    throw new ApiError(401,"User Name or Password is required.")
 }

 const user = await User.findOne({$or:[{userName},{email}]})

 if(!user){
    throw new ApiError(404,"User does not exist.")
 }

 const isValidUser = await user.isPasswordCorrect(password)
  if(!isValidUser){
    throw new ApiError(404,"Invalid Password.")
   }

  const { refreshToken , accessToken } = await generateAccessAndRefreshTokens(user._id);
  const logedInUser = await User.findById(user._id).select("-password -refreshToken");
  
  const options = {
    httpOnly:true,
    secure:true,
  }

   return res.status(200)
  .cookie("accessToken",accessToken , options)
  .cookie("refreshToken", refreshToken , options)
  .json(
     new ApiResponse(
        200,
        {user: logedInUser, refreshToken,accessToken},
         "User LogIn Successfully."
     )
    )
})  

const logOutUser = asynchandler ( async (req, res) => {

    await User.findByIdAndUpdate(req.user?._id,
        {
            $unset:{refreshToken: 1}
        },
        {
        new:true
        }
    )

    const options = {
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logout Successfully."))
})

const accessRefreshTokens = asynchandler(async (req, res)=>{
    const currentRefreshToke = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ","")
    if(!currentRefreshToke){
      throw new ApiError(401,"Unauthorized request.")
    }

   const decodedToken =  jwt.verify(currentRefreshToke, process.env.REFRESH_TOKEN_SECRT)

   const user = await User.findById(decodedToken?._id)
   if(!user){
    throw new ApiError(401,"Invalid refresh token.")
   }

   if(currentRefreshToke !== user?.refreshToken){
    throw new ApiError(401,"Refresh token is expired or used.")
   }

   const options ={
    httpOnly:true,
    secure:true
   }

 const { accessToken , refreshToken} =  await generateAccessAndRefreshTokens(user?._id)

 return res.status(200)
 .cookie("accessToken",accessToken ,options)
 .cookie("refreshToken",refreshToken ,options)
 .json(new ApiResponse(200,{accessToken , refreshToken }, "Access token refreshed successfully."))


})

const changeCurrentPassword = asynchandler(async (req , res) => {
    const {oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user?._id)
    const isValidPassword = await user.isPasswordCorrect(oldPassword);

    if(!isValidPassword){
        throw new ApiError(400, "Invalid password.")  
    }

    user.password = newPassword
     await user.save({validateBeforeSave:false})
     return res.status(200).json(new ApiResponse(200,{},"Password changed successfully."))
})

const getCurrentUser = asynchandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "current user fetched successfully."))
})

const updateUserAccount = asynchandler( async (req , res ) => {
    const {fullName , email} = req.body;
    if(!(fullName || email)){
      throw new ApiError(400, "Full Name or Email are required.")
    }

    const user = await User.findByIdAndUpdate(req.user?._id , 
        {
            $set:{
                fullName,
                email,
            }
        },
        {
         new:true
        }

    ).select("-password")

    return res.status(200).json(new ApiResponse(200, user , "User update successfully."))
})

const updateUserAvater = asynchandler(async (req, res) => {
    const localAvatarPath = req.file?.path

    if(!localAvatarPath){
        throw new ApiError(400,"Avatar field is required.")
    }

    const avatar = await UploadonCloudinary(localAvatarPath)
    if(!avatar){
        throw new ApiError(500, "Error while uploading on avatar.")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar : avatar.url
            }
        },
        {new:true}
    ).select("-password")
     if (req.user?.avatar) {
        const publicUid = getPublicIdFromUrl(req.user.avatar);
        try {
            const deleteFile = await deleteCloudinariyFile(publicUid);
        } catch (error) {
            console.error("Error deleting previous avatar:", error.message);
        }
    }
    return res.status(200).json(new ApiResponse(200, user , "Avatar is updated successfully."))
})

const updateUserCoverImage = asynchandler(async (req, res) => {
    const localCoverImagePath = req.file?.path
    if(!localCoverImagePath){
        throw new ApiError(400,"Cover Image field is required.")
    }
    const coverImage = await UploadonCloudinary(localCoverImagePath)
    if(!coverImage){
        throw new ApiError(500, "Error while uploading on Cover Image.")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage : coverImage.url
            }
        },
        {new:true}
    ).select("-password")
    if (req.user?.avatar) {
        const publicUid = getPublicIdFromUrl(req.user.coverImage);
        try {
            const deleteFile = await deleteCloudinariyFile(publicUid);
        } catch (error) {
            console.error("Error deleting previous avatar:", error.message);
        }
    }
    return res.status(200).json(new ApiResponse(200, user , "Cover Image is updated successfully."))
})

export { 
     registerUser,
     loginUser,
     logOutUser,
     accessRefreshTokens,
     changeCurrentPassword,
     getCurrentUser,
     updateUserAccount,
     updateUserAvater,
     updateUserCoverImage,
    }