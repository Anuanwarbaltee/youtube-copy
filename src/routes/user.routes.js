import { Router } from "express";
import {
     registerUser,
     loginUser ,
     logOutUser,
     accessRefreshTokens,
     changeCurrentPassword,
     getCurrentUser,
     updateUserAccount,
     updateUserCoverImage,
     updateUserAvater,
     addWatchHistory,
     getWatchHistory,
    } from "../controlers/user.controller.js"
import {upload} from "../midleware/multer.mildleware.js"
import { verifyJWT } from "../midleware/auth.midleware.js"



const router = Router()

router.route("/register").post(upload.fields(
    [
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
)
router.route("/login").post(loginUser)

// Secure Routes
router.route("/logout").post(verifyJWT, logOutUser)
router.route("/refresh-token").post(accessRefreshTokens)
router.route("/update-password").patch(verifyJWT,changeCurrentPassword)
router.route("/get-current").get(verifyJWT,getCurrentUser)
router.route("/update-user").patch(verifyJWT,updateUserAccount)
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar") ,updateUserAvater)
router.route("/update-coverImage").patch(verifyJWT, upload.single("coverImage") ,updateUserCoverImage)
router.route("/add-history").post(verifyJWT,addWatchHistory)
router.route("/watch-history").get(verifyJWT,getWatchHistory)
export default router