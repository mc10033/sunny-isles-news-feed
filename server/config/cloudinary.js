const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImage = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'sunny-isles-news',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      resource_type: 'auto'
    });
    
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
};

const deleteImage = async (publicId) => {
  try {
    if (publicId && publicId.includes('cloudinary')) {
      const publicIdFromUrl = publicId.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicIdFromUrl);
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

module.exports = { uploadImage, deleteImage }; 