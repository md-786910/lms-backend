const { ENV_VARIABLE } = require("../constants/env");

const cloudinaryv2 = require("cloudinary").v2;

cloudinaryv2.config({
  cloud_name: ENV_VARIABLE.CLOUDINARY_NAME, // Replace with your Cloudinary cloud name
  api_key: ENV_VARIABLE.CLOUDINARY_API_KEY, // Replace with your Cloudinary API key
  api_secret: ENV_VARIABLE.CLOUDINARY_API_SECRET, // Replace with your Cloudinary API secret
});

module.exports = cloudinaryv2;
