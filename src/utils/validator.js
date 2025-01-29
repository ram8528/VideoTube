import { isValidObjectId } from "mongoose";
import { apiError } from "./apiError";

export const validateObjectId = (id, type = "id") => {
    if(!isValidObjectId(id)) {
        throw new apiError(400, `Invalid ${type}`)
    }
};