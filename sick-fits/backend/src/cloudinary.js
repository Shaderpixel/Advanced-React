const cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name: 'shaderpixel',
  api_key: '315292312174564',
  api_secret: process.env.CLOUDINARY_SECRET,
});

module.exports = cloudinary;
