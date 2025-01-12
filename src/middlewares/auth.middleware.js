import {asyncHandler} from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const VerifyJWT = asyncHandler(async(req,_,next) => {
    try {
        const token = req.cookies?.accessToken || req.header
        ("Authorization")?.replace("Bearer ","")
    
        if(!token) {
            throw new apiError(401,"Unauthorized Access")
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select
            ("-password -refreshToken")
        
        if(!user) {
            throw new apiError(401,"Invalid Access Token")
        }    
    
        req.user = user;
        next()
    } catch (error) {
        throw new apiError(401, error?.message || "Invalid Access Token")
    }

})




// when something passed is not in use then pass it as _ 