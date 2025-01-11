# VideoTube

This is a backend with Javascript VideoTube
// require("dotenv").config({path: './env'})
#Less Preffered approach to connect DB 
import express from "express";
const app = express();
// ;(()=>{})()  -> IIFE

( async() => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error" , (error) => {
            console.log("Error : ",error);
            throw error
        })

        app.listen(process.env.PORT,() => {
            console.log(`Server is running on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.log("Error : ",error)
        throw err
    }
})()