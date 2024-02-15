import { v2 as cloudinary } from "cloudinary";

import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloud = async (localPath) => {
  try {
    if (!localPath) return null;
    //upload file on cloud
    const response = await cloudinary.uploader.upload(localPath, {
      resource_type: "auto",
    });

    // file succesfully upload
    console.log("file upload on cloudnary", response.url);
    fs.unlinkSync(localPath)
    return response;
  } catch (error) {
    fs.unlinkSync(localPath) // remove the loacally saved unwanted file
    return null
  }
};

export {uploadOnCloud}

