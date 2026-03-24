const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const auth = require('../middleware/auth');
const upload = require('../middleware/cloudinaryUpload');
const cloudinary = require('cloudinary').v2;
const config = require('../config/config');

// 配置 Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret
});

// 获取所有供应商
router.get('/', auth, async (req, res) => {
  try {
    const { categoryId, search } = req.query;
    
    let query = {};
    if (categoryId) {
      query.categoryId = categoryId;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { business: { $regex: search, $options: 'i' } }
      ];
    }
    
    const suppliers = await Supplier.find(query).populate('categoryId');
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 获取单个供应商
router.get('/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id).populate('categoryId');
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 创建供应商
router.post('/', auth, async (req, res) => {
  try {
    const { name, contact, contactPerson, business, isContractor, note, categoryId, images } = req.body;
    
    const supplier = new Supplier({
      name,
      contact,
      contactPerson,
      business,
      isContractor,
      note,
      categoryId,
      images: images || []
    });
    
    await supplier.save();
    
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 更新供应商
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, contact, contactPerson, business, isContractor, note, categoryId, images } = req.body;
    
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      {
        name,
        contact,
        contactPerson,
        business,
        isContractor,
        note,
        categoryId,
        images: images || []
      },
      { new: true }
    );
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 删除供应商
router.delete('/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.json({ message: 'Supplier deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 上传图片
router.post('/:id/upload', auth, upload.array('images', 10), async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    // 添加上传的图片（使用 Cloudinary URL）
    const newImages = req.files.map(file => ({
      url: file.path, // Cloudinary 返回的完整 URL
      publicId: file.filename, // Cloudinary 的 public_id
      description: ''
    }));
    
    supplier.images = [...supplier.images, ...newImages];
    await supplier.save();
    
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 删除图片
router.delete('/:id/images/:imageIndex', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    const imageIndex = parseInt(req.params.imageIndex);
    if (imageIndex < 0 || imageIndex >= supplier.images.length) {
      return res.status(400).json({ message: 'Invalid image index' });
    }
    
    const imageToDelete = supplier.images[imageIndex];
    
    // 从 Cloudinary 删除图片
    if (imageToDelete.publicId) {
      await cloudinary.uploader.destroy(imageToDelete.publicId);
    }
    
    // 从数据库中删除图片记录
    supplier.images.splice(imageIndex, 1);
    await supplier.save();
    
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
