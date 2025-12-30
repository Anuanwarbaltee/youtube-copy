import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});


const UploadonCloudinary = async (localFile , mimeType) => {
  try {

    if (!localFile) return null;
    let resourceType = "auto";

    if (mimeType?.startsWith("image/")) {
      resourceType = "image";
    } else if (mimeType?.startsWith("video/")) {
      resourceType = "video";
    }
    const response = await cloudinary.uploader.upload(localFile, {
      resource_type: resourceType, 
    });

    fs.unlinkSync(localFile);
    return response;
  } catch (error) {
    console.error("Cloudinary upload error:", error);

    if (fs.existsSync(localFile)) {
      fs.unlinkSync(localFile);
    }

    return null;
  }
};


const getPublicIdFromUrl = (url) => {
  const matches = url.match(/upload\/(?:v\d+\/)?(.+)\./);
  return matches ? matches[1] : null;
};

const deleteCloudinariyFile = async (filePath , type = "image") => {
    try {
        if(!filePath) return  null
        // Delete File
        let response = await  cloudinary.uploader.destroy(filePath,
            {
             resource_type: type,
            }
        )
        // fs.unlinkSync(localFile)   
        return  response
    
     } catch (error) {
        // fs.unlinkSync(localFile)
        return null
     }
}

export {UploadonCloudinary , deleteCloudinariyFile , getPublicIdFromUrl}
    