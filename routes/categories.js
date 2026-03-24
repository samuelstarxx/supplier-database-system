const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth');

// 获取所有分类
router.get('/', auth, async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 创建分类
router.post('/', auth, async (req, res) => {
  try {
    const { name, order } = req.body;
    
    const category = new Category({ name, order });
    await category.save();
    
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 更新分类
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, order } = req.body;
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, order },
      { new: true }
    );
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 删除分类
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
