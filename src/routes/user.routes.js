import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { registerUser,loginUser, logoutUser,refreshAcessToken } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

// Define the POST route
userRouter.route("/register").post(
    upload.fields([ //multer middleware used to handle mulitple files in a form-data request
        {
            name:"avatar",
            maxCount:1 //max 1 file hosakti hai isme
        },
        {
            name:"coverImage",
            maxCount:1
        }

    ]),
    registerUser);  // ye method execute krne se pehle middleware inject krdiya


userRouter.route("/login").post(loginUser)

userRouter.route("/logout").post(verifyJWT,logoutUser);

userRouter.route("/refresh-token").post(refreshAcessToken)

export default userRouter;
