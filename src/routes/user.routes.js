import { Router } from "express";
import {registerUser, loginUser , logOutUser, accessRefreshTokens} from "../controlers/user.controller.js"
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
router.route("/logout").post(verifyJWT, logOutUser)
router.route("/refresh-token").post(accessRefreshTokens)

export default router