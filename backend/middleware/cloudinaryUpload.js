const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const config = require('../config/config');

// 配置 Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret
});

// 配置 Cloudinary 存储
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'supplier-images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

// 创建上传实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.maxFileSize
  }
});

module.exports = upload;
