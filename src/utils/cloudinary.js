import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});


const UploadonCloudinary = async (localFile) =>{
 try {
    if(!localFile) return  null
    // Upload File
    let response = await  cloudinary.uploader.upload(localFile,
        {
         resource_type:"auto",
        }
    )
    fs.unlinkSync(localFile)
    return  response
 } catch (error) {
    fs.unlinkSync(localFile)
    return null
 }

}

const getPublicIdFromUrl = (url) => {
    const parts = url.split('/');
    return parts[parts.length - 1].split('.')[0]; // Extracts the file name without extension
  };

const deleteCloudinariyFile = async (filePath) => {
    try {
        if(!filePath) return  null
        // Delete File
        let response = await  cloudinary.uploader.destroy(filePath,
            {
             resource_type:"image",
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
    