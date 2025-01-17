import { v2 as cloudinary } from "cloudinary";
// cloudinary is just an alias you can use any name
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// uploading file via multer then fetch it to local system and then on cloudinary

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // console.log("File is uploaded on cloudinary successfully ", response);

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    if(fs.existsSync(localFilePath)){
      fs.unlinkSync(localFilePath);
    }
    console.log("Error uploading to Cloudinary: ",error);
    throw new Error("Error while uploading file on cloudinary");
  }
};

export { uploadOnCloudinary };
