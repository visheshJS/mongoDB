import mongoose,{Schema} from "mongoose";

const subscriptionSchmea= new Schema({
    subscriber:{
        type:Schema.Types.ObjectId, //one who is subscribing to channel
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId, //one to whom user is subscribed
        ref:"User"
        
    }


},  
    {
    timestamps:true
    }
)

export const Subscription = mongoose.model("Subscription",subscriptionSchmea)