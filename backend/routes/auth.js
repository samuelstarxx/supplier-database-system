const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT配置 - 直接使用 process.env
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '30d';

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // 创建新用户
    const user = new User({
      username,
      password,
      role: role || 'user'
    });
    
    await user.save();
    
    // 生成token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );
    
    res.status(201).json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('登录请求:', { username });
    
    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      console.log('用户不存在');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // 验证密码
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log('密码不匹配');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // 生成token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );
    
    console.log('登录成功:', { username });
    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
