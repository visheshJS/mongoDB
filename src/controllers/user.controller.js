import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "..models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser= asyncHandler( async (req,res)=>{
   
    //get user details from front-end(postman ke through data le sakte hai)
    //validation (email empty to nahi ya correct format me hai ki nahi, and many possitibilites of wrong things)
    //check if user already exits :by username or email
    //check files hain ki nahi (check for images , check for avatar)
    //available hain fir then upload them to cloudinary
    //create user object-- create entry in db
    //remove password and refresh token feild from response
    //check for user creation
    //return response 

    const {fullName,email,username,password}= req.body
    console.log("email: ",email);
    /*
    
    ya to har cheez ko if else laga laga ke validate karo ya fir use next method

    if(fullName===""){
        throw new ApiError(400,"fullname is required")
    }

    */

    if (
        [fullName,email,username,password].some((field)=>
        field?.trim()==="")
    ) {
        throw new ApiError(400,"fullname is required");
        
    }

    const existerUser = User.findOne({
        $or: [{ username }, { email }]

    })
    if(existerUser){
        throw new ApiError(409,"User with this email or username already exists");

    }
    //req.files ka option multer se milta hai
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")

    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    //ab database me entry marenge sab cheezz hain hamare paas

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser= await User.findById(user._id).select(
        //isme vo likhte hain jo nahi chahiye aage
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"something went wrong while registering the user")

    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"user registered successfully")
    )


});


export default registerUser;