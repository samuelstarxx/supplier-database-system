const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('./config/config');

// 导入模型
const User = require('./models/User');
const Category = require('./models/Category');
const Supplier = require('./models/Supplier');

// 导入路由
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const supplierRoutes = require('./routes/suppliers');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 连接 MongoDB
mongoose.connect(config.mongoURI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);

// 初始化默认数据
const initializeDefaultData = async () => {
  try {
    // 检查是否已有管理员账号
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      await User.create({
        username: 'admin',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('默认管理员账号已创建: username=admin, password=admin123');
    }

    // 检查是否已有默认分类
    const categoriesCount = await Category.countDocuments();
    if (categoriesCount === 0) {
      const defaultCategories = [
        { name: '水电', order: 1 },
        { name: '地板', order: 2 },
        { name: '瓷砖', order: 3 },
        { name: '五金', order: 4 },
        { name: '门窗', order: 5 },
        { name: '灯具照明', order: 6 },
        { name: '家具', order: 7 },
        { name: '设备', order: 8 },
        { name: '石材', order: 9 }
      ];
      await Category.insertMany(defaultCategories);
      console.log('默认分类已创建');
    }

    console.log('数据初始化完成');
  } catch (error) {
    console.error('数据初始化错误:', error);
  }
};

// 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeDefaultData();
});
