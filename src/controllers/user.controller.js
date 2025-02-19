import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken= async(userId)=>{
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken= refreshToken;
        await user.save({ validateBeforeSave: false });

        return {accessToken,refreshToken};



    }
    catch(error){
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens")

    }

}

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

    const existerUser = await User.findOne({
        $or: [{ username }, { email }]

    })
    if(existerUser){
        throw new ApiError(409,"User with this email or username already exists");

    }
    // console.log(req.files)
    //req.files ka option multer se milta hai
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage)
    && req.files.coverImage.length > 0) {
        coverImageLocalPath=req.files.coverImage[0].path

    }


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

const loginUser= asyncHandler(async (req,res)=>{

    //take body from req.body
    //check if username or email , ye sab hai ki nahi
    //find the user
    //password check is user exist
    //if password checked- generate access and refresh token and send to user
    //send cookies 

    const {email,username,password} =req.body;

    if(!(username||email)){
        throw new ApiError(400,"username or email is required");

    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User does not exist !")

    }
    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401," Invalid user credentials ")



    }
    const {refreshToken,accessToken}= await generateAccessAndRefreshToken(user._id)

    const loggedInUser= await User.findById(user._id).select("-password -refreshToken")

    const options ={
        //only modifiable by server , frontend cant change it
        httpOnly:true,
        secure:true
    }

    return res.status(200).cookie  //jitne marzi cookie de sakte hain
    (
        "accessToken",accessToken,options
        ).cookie(
            "refreshToken",refreshToken,options

    ).json(
        new ApiResponse(200,
        {
            user:loggedInUser,accessToken,refreshToken
        },
        "User logged in successfully"
        )
    )







})

const logoutUser= asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }

        },
        {
            new:true
        }
    )

    const options ={
        //only modifiable by server , frontend cant change it
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user logged out"))


})

const refreshAcessToken = asyncHandler(async (req,res)=>{
    const incomingRefToken=req.cookies.refreshToken||req.body.refreshToken;

    if(!incomingRefToken){
        throw new ApiError(401, "unauthorized request")
    }
    try {
        const decodedToken=jwt.verify(
            incomingRefToken,process.env.REFRESH_TOKEN_SECRET
        )
        const user=await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "invalid refresh token")
        }
    
        if(incomingRefToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken}=await generateAccessAndRefreshToken(user._id)
        
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken: newRefreshToken},
                "Access Token Refreshed"
    
            )
        )
    } catch (error){
        throw new ApiError(401,error?.message||"Invalid Refresh Token")
        
    }

    


})
const changePassword = asyncHandler(async (req,res)=>{
    const {oldPassword,newPassword}=req.body
    const user = await User.findById(req.user?.id)
    const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(401,"Invalid Old Password")

    }
    user.password=newPassword;
    await user.save({validateBeforeSave:false});

    return res.status(200).json(new ApiResponse (200,{},"Password Changed successfully"))


    



})

const getCurrentUser = asyncHandler(async (req,res)=>{

    return res.status(200)
    .json(new ApiResponse(200,req.user,"Current User fetched successfully"))
})

const updateInfo = asyncHandler(async (req,res)=>{
    const {fullName,email}=req.body;
    if(!fullName && !email){
        throw new ApiError(400,"all feilds are required")
    }
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName:fullName,
                email:email
            }

        },
        {
            new:true,
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"User Info updated successfully"))

})

const updateUserAvatar = asyncHandler(async (req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required")
    }
    const avatar= await cloudinary.uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400,"Avatar upload failed")
    }
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new:true,
        }
    ).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"User Avatar updated successfully"))
})
const updateUserCoverImage = asyncHandler(async (req,res)=>{
    const coverLocalPath=req.file?.path
    if(!coverLocalPath){
        throw new ApiError(400,"Cover Image is required")
    }
    const coverImage= await cloudinary.uploadOnCloudinary(coverLocalPath)
    if(!coverImage.url){
        throw new ApiError(400,"cover image upload failed")
    }
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {
            new:true,
        }
    ).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"User cover image updated successfully"))
})



export {registerUser,
    loginUser,
    logoutUser,
    refreshAcessToken,
    changePassword,
    getCurrentUser,
    updateInfo,
    updateUserAvatar,
    updateUserCoverImage};
