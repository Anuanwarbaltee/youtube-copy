import mongoose, {Schema, Types} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber:{
        Types:Schema.Types.ObjectId,
        ref:"User", 
    },
    channel:{
        Types:Schema.Types.ObjectId,
        ref:"User", 
    },
},
 {timestamps:true}
);

const Subscription = mongoose.model("Subscription",subscriptionSchema);

export  default Subscription