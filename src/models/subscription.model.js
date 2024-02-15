import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({
    subscriber :{
        type : Schema.Types.ObjectId, // one who is sub
        ref : "User"
    },
    channal : {
        subscriber :{
            type : Schema.Types.ObjectId, // one who is sub
            ref : "User"
        }
    }
} , { timestamps: true });





export const Subscription = mongoose.model("Subscription" , subscriptionSchema)