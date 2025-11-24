import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'; 


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'abcd',
    api_key: process.env.CLOUDINARY_API_KEY || '145819391372177',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'mn-0MmAJbeicF5kfZNQHZQsZ-m4',
});




const uploadToCloudinary = async (filePath) => { 
    try {
        if (!filePath) return null;

      const response = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto"
        })

        console.log('File uploaded to Cloudinary successfully');
        return response.secure_url;

    }
     
    catch (error) {
             
           fs.unlinkSync(filePath);
         // remove the  locally saved temporary file as the upload operation gat failed 
           
           return null;

        } 

};

export { uploadToCloudinary };





cloudinary.uploader
  .upload('https://upload.wikimedia.org/wikipedia/en/c/c8/Subham_poster.jpeg')
  .then(result => console.log('Uploaded:', result.secure_url))
  .catch(error => console.error('Error:', error));