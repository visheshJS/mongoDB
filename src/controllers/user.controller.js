import {asyncHandler} from "../utils/asyncHandler.js"

const registerUser= asyncHandler( async (req,res)=>{
    try{
        console.log("Register route hit");

    }catch(error){
        console.error("not reaching request")
        throw error
    }
    return res.status(200).json({
        message:"ok"
    })
})


export {registerUser}