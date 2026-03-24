import React, { useState, useEffect } from 'react';
import './App.css';

// API基础URL（使用相对路径，部署后会自动使用正确的域名）
const API_URL = '/api';

// 从localStorage获取token
const getToken = () => {
  return localStorage.getItem('token');
};

// 设置token到localStorage
const setToken = (token) => {
  localStorage.setItem('token', token);
};

// 清除token
const clearToken = () => {
  localStorage.removeItem('token');
};

// 通用API请求函数
const apiRequest = async (endpoint, method = 'GET', data = null) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers,
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'API request failed');
    }
    
    return result;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// 图片上传函数
const uploadImages = async (supplierId, files) => {
  const token = getToken();
  const formData = new FormData();
  
  Array.from(files).forEach(file => {
    formData.append('images', file);
  });
  
  try {
    const response = await fetch(`${API_URL}/suppliers/${supplierId}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Upload failed');
    }
    
    return result;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

function App() {
  // 状态管理
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact: '',
    contactPerson: '',
    business: '',
    isContractor: false,
    categoryId: '',
    note: ''
  });
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dragEnabled, setDragEnabled] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const [showLogin, setShowLogin] = useState(!isAuthenticated);
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });

  // 登录
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await apiRequest('/auth/login', 'POST', loginForm);
      setToken(result.token);
      setIsAuthenticated(true);
      setShowLogin(false);
      // 登录成功后加载数据
      loadCategories();
    } catch (error) {
      alert('登录失败: ' + error.message);
    }
  };



  // 登出
  const handleLogout = () => {
    clearToken();
    setIsAuthenticated(false);
    setShowLogin(true);
    setCategories([]);
    setSuppliers([]);
    setSelectedCategory(null);
  };

  // 加载分类
  const loadCategories = async () => {
    try {
      const data = await apiRequest('/categories');
      setCategories(data);
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  // 加载供应商
  const loadSuppliers = async (categoryId = null) => {
    try {
      let endpoint = '/suppliers';
      if (categoryId) {
        endpoint += `?categoryId=${categoryId}`;
      }
      if (searchTerm) {
        endpoint += `${categoryId ? '&' : '?'}search=${searchTerm}`;
      }
      const data = await apiRequest(endpoint);
      setSuppliers(data);
    } catch (error) {
      console.error('加载供应商失败:', error);
    }
  };

  // 选择分类
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    loadSuppliers(category.id);
  };

  // 拖动开始
  const handleDragStart = (e, item, type) => {
    setDraggedItem({ item, type });
    e.dataTransfer.effectAllowed = 'move';
  };

  // 拖动结束
  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // 拖动经过
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // 放置
  const handleDrop = (e, targetItem, type) => {
    e.preventDefault();
    
    if (draggedItem && draggedItem.type === type) {
      if (type === 'category') {
        // 分类排序
        const newCategories = [...categories];
        const draggedIndex = newCategories.findIndex(cat => cat.id === draggedItem.item.id);
        const targetIndex = newCategories.findIndex(cat => cat.id === targetItem.id);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
          const [dragged] = newCategories.splice(draggedIndex, 1);
          newCategories.splice(targetIndex, 0, dragged);
          
          // 更新排序权重
          const updatedCategories = newCategories.map((cat, index) => ({
            ...cat,
            order: index + 1
          }));
          
          setCategories(updatedCategories);
        }
      } else if (type === 'supplier') {
        // 供应商排序
        const newSuppliers = [...suppliers];
        const draggedIndex = newSuppliers.findIndex(sup => sup.id === draggedItem.item.id);
        const targetIndex = newSuppliers.findIndex(sup => sup.id === targetItem.id);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
          const [dragged] = newSuppliers.splice(draggedIndex, 1);
          newSuppliers.splice(targetIndex, 0, dragged);
          setSuppliers(newSuppliers);
        }
      }
    }
  };

  // 调整字体大小
  const adjustFontSize = (element) => {
    if (!element) return;
    
    const maxWidth = element.offsetWidth;
    let fontSize = 16; // 初始字体大小
    element.style.fontSize = `${fontSize}px`;
    
    while (element.scrollWidth > maxWidth && fontSize > 4) {
      fontSize--;
      element.style.fontSize = `${fontSize}px`;
    }
  };

  // 组件挂载后调整字体大小
  useEffect(() => {
    setTimeout(() => {
      const categoryElements = document.querySelectorAll('.category-name');
      categoryElements.forEach(adjustFontSize);
    }, 100);
  }, [categories]);

  // 窗口大小变化时调整字体大小
  useEffect(() => {
    const handleResize = () => {
      const categoryElements = document.querySelectorAll('.category-name');
      categoryElements.forEach(adjustFontSize);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 初始化数据
  useEffect(() => {
    if (isAuthenticated) {
      loadCategories();
    }
  }, [isAuthenticated]);

  // 搜索变化时重新加载供应商
  useEffect(() => {
    if (selectedCategory) {
      loadSuppliers(selectedCategory.id);
    } else {
      loadSuppliers();
    }
  }, [searchTerm]);

  // 新增分类
  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      try {
        const newCategory = {
          name: newCategoryName.trim(),
          order: categories.length + 1
        };
        await apiRequest('/categories', 'POST', newCategory);
        await loadCategories();
        setNewCategoryName('');
        setShowAddCategory(false);
      } catch (error) {
        alert('添加分类失败: ' + error.message);
      }
    }
  };

  // 编辑分类
  const handleEditCategory = (category) => {
    setEditingCategory(category);
  };

  // 保存分类编辑
  const handleSaveCategory = async () => {
    if (editingCategory && editingCategory.name.trim()) {
      try {
        await apiRequest(`/categories/${editingCategory.id}`, 'PUT', editingCategory);
        await loadCategories();
        setEditingCategory(null);
      } catch (error) {
        alert('保存分类失败: ' + error.message);
      }
    }
  };

  // 删除分类
  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('确定要删除这个分类吗？')) {
      try {
        await apiRequest(`/categories/${categoryId}`, 'DELETE');
        await loadCategories();
        if (selectedCategory && selectedCategory.id === categoryId) {
          setSelectedCategory(null);
          setSuppliers([]);
        }
      } catch (error) {
        alert('删除分类失败: ' + error.message);
      }
    }
  };

  // 新增供应商
  const handleAddSupplier = async () => {
    if (newSupplier.name.trim() && newSupplier.categoryId) {
      try {
        await apiRequest('/suppliers', 'POST', newSupplier);
        await loadSuppliers(selectedCategory?.id);
        setNewSupplier({
          name: '',
          contact: '',
          contactPerson: '',
          business: '',
          isContractor: false,
          categoryId: '',
          note: ''
        });
        setShowAddSupplier(false);
      } catch (error) {
        alert('添加供应商失败: ' + error.message);
      }
    }
  };

  // 编辑供应商
  const handleEditSupplier = (supplier) => {
    setEditingSupplier({...supplier});
  };

  // 保存供应商编辑
  const handleSaveSupplier = async () => {
    if (editingSupplier && editingSupplier.name.trim()) {
      try {
        await apiRequest(`/suppliers/${editingSupplier.id}`, 'PUT', editingSupplier);
        await loadSuppliers(selectedCategory?.id);
        setEditingSupplier(null);
      } catch (error) {
        alert('保存供应商失败: ' + error.message);
      }
    }
  };

  // 删除供应商
  const handleDeleteSupplier = async (supplierId) => {
    if (window.confirm('确定要删除这个供应商吗？')) {
      try {
        await apiRequest(`/suppliers/${supplierId}`, 'DELETE');
        await loadSuppliers(selectedCategory?.id);
      } catch (error) {
        alert('删除供应商失败: ' + error.message);
      }
    }
  };

  // 批量导出供应商数据
  const handleExportSuppliers = () => {
    // 这里实现导出功能
    alert('导出功能待实现');
  };

  // 查看供应商详情
  const handleViewDetails = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDetails(true);
  };

  // 处理图片上传
  const handleImageUpload = async (supplierId, event) => {
    const files = event.target.files;
    if (files.length > 0) {
      try {
        await uploadImages(supplierId, files);
        await loadSuppliers(selectedCategory?.id);
      } catch (error) {
        alert('上传图片失败: ' + error.message);
      }
    }
  };

  // 删除图片
  const handleDeleteImage = async (supplierId, imageIndex) => {
    try {
      await apiRequest(`/suppliers/${supplierId}/images/${imageIndex}`, 'DELETE');
      await loadSuppliers(selectedCategory?.id);
    } catch (error) {
      alert('删除图片失败: ' + error.message);
    }
  };

  // 处理图片点击，实现全屏查看
  const handleImageClick = (imageUrl) => {
    if (fullscreenImage === imageUrl) {
      setFullscreenImage(null);
    } else {
      setFullscreenImage(imageUrl);
    }
  };

  // 过滤供应商
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesCategory = selectedCategory ? supplier.categoryId === selectedCategory.id : true;
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.business.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="app">
      {/* 登录表单 */}
      {showLogin && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>登录</h3>
            </div>
            <div className="modal-body">
              <form onSubmit={handleLogin}>
                <input
                  type="text"
                  placeholder="用户名"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  required
                />
                <input
                  type="password"
                  placeholder="密码"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  required
                />
                <div className="form-actions">
                  <button type="submit">登录</button>
                </div>
                <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                  请联系管理员获取账号密码
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 顶部导航栏 */}
      <header className="header">
        <h1>供应商数据库系统</h1>
        <div className="header-actions">
          <input
            type="text"
            placeholder="搜索供应商..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="settings-btn" onClick={handleLogout}>登出</button>
        </div>
      </header>

      <div className="main-content">
        {/* 左侧分类菜单 */}
        <aside className="sidebar">
          <h2>材料分类</h2>
          <ul className="category-list">
            {categories.map(category => (
              <li 
                key={category.id} 
                className={selectedCategory?.id === category.id ? 'active' : ''}
                draggable={dragEnabled}
                onDragStart={(e) => handleDragStart(e, category, 'category')}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, category, 'category')}
              >
                {editingCategory?.id === category.id ? (
                  <div className="edit-category">
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                    />
                    <button onClick={handleSaveCategory}>保存</button>
                    <button onClick={() => setEditingCategory(null)}>取消</button>
                  </div>
                ) : (
                  <>
                    <div className="category-name" onClick={() => handleCategorySelect(category)}>{category.name}</div>
                    <div className="category-actions">
                      <button onClick={() => handleEditCategory(category)}>编辑</button>
                      <button onClick={() => handleDeleteCategory(category.id)}>删除</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
          {showAddCategory ? (
            <div className="add-category-form">
              <input
                type="text"
                placeholder="输入分类名称"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <button onClick={handleAddCategory}>添加</button>
              <button onClick={() => setShowAddCategory(false)}>取消</button>
            </div>
          ) : (
            <button className="add-category-btn" onClick={() => setShowAddCategory(true)}>新增分类</button>
          )}
          <div className="drag-control">
            <label>
              <input
                type="checkbox"
                checked={dragEnabled}
                onChange={(e) => setDragEnabled(e.target.checked)}
              />
              启用拖动排序
            </label>
          </div>
        </aside>

        {/* 右侧内容区 */}
        <main className="content">
          {selectedCategory ? (
            <div className="category-content">
              <div className="category-header">
                <h2>{selectedCategory.name}</h2>
                <button className="add-supplier-btn" onClick={() => setShowAddSupplier(true)}>添加供应商</button>
                <button className="export-btn" onClick={handleExportSuppliers}>批量导出</button>
              </div>

              {/* 供应商列表 */}
              <div className="supplier-list">
                <table>
                  <thead>
                    <tr>
                      <th>公司名</th>
                      <th>联系方式</th>
                      <th>联系人</th>
                      <th>主要业务</th>
                      <th>是否包工</th>
                      <th>备注</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map(supplier => (
                      <tr 
                        key={supplier.id}
                        draggable={dragEnabled}
                        onDragStart={(e) => handleDragStart(e, supplier, 'supplier')}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, supplier, 'supplier')}
                      >
                        <td>{supplier.name}</td>
                        <td>{supplier.contact}</td>
                        <td>{supplier.contactPerson}</td>
                        <td>{supplier.business}</td>
                        <td>{supplier.isContractor ? '是' : '否'}</td>
                        <td>
                          <div className="note-section">
                            <button className="detail-btn" onClick={() => handleViewDetails(supplier)}>详情</button>
                            <button className="edit-btn" onClick={() => handleEditSupplier(supplier)}>编辑</button>
                          </div>
                        </td>
                        <td>
                          <button className="delete-btn" onClick={() => handleDeleteSupplier(supplier.id)}>删除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 新增供应商表单 */}
              {showAddSupplier && (
                <div className="add-supplier-form">
                  <h3>添加供应商</h3>
                  <input
                    type="text"
                    placeholder="公司名称"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="联系方式"
                    value={newSupplier.contact}
                    onChange={(e) => setNewSupplier({...newSupplier, contact: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="联系人"
                    value={newSupplier.contactPerson}
                    onChange={(e) => setNewSupplier({...newSupplier, contactPerson: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="主要业务"
                    value={newSupplier.business}
                    onChange={(e) => setNewSupplier({...newSupplier, business: e.target.value})}
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={newSupplier.isContractor}
                      onChange={(e) => setNewSupplier({...newSupplier, isContractor: e.target.checked})}
                    />
                    包工
                  </label>
                  <select
                    value={newSupplier.categoryId}
                    onChange={(e) => setNewSupplier({...newSupplier, categoryId: e.target.value})}
                  >
                    <option value="">选择分类</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <textarea
                    placeholder="备注"
                    value={newSupplier.note}
                    onChange={(e) => setNewSupplier({...newSupplier, note: e.target.value})}
                  ></textarea>
                  <div className="form-actions">
                    <button onClick={handleAddSupplier}>保存</button>
                    <button onClick={() => setShowAddSupplier(false)}>取消</button>
                  </div>
                </div>
              )}

              {/* 编辑供应商表单 */}
              {editingSupplier && (
                <div className="edit-supplier-form">
                  <h3>编辑供应商</h3>
                  <input
                    type="text"
                    placeholder="公司名称"
                    value={editingSupplier.name}
                    onChange={(e) => setEditingSupplier({...editingSupplier, name: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="联系方式"
                    value={editingSupplier.contact}
                    onChange={(e) => setEditingSupplier({...editingSupplier, contact: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="联系人"
                    value={editingSupplier.contactPerson}
                    onChange={(e) => setEditingSupplier({...editingSupplier, contactPerson: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="主要业务"
                    value={editingSupplier.business}
                    onChange={(e) => setEditingSupplier({...editingSupplier, business: e.target.value})}
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={editingSupplier.isContractor}
                      onChange={(e) => setEditingSupplier({...editingSupplier, isContractor: e.target.checked})}
                    />
                    包工
                  </label>
                  <select
                    value={editingSupplier.categoryId}
                    onChange={(e) => setEditingSupplier({...editingSupplier, categoryId: e.target.value})}
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <textarea
                    placeholder="备注"
                    value={editingSupplier.note}
                    onChange={(e) => setEditingSupplier({...editingSupplier, note: e.target.value})}
                  ></textarea>
                  <div className="image-upload-section">
                    <h4>图片管理</h4>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(editingSupplier.id, e)}
                    />
                    <div className="image-preview">
                      {(editingSupplier.images || []).map((image, index) => (
                        <div key={index} className="image-item">
                          <img src={image.url} alt={`Image ${index + 1}`} />
                          <button onClick={() => handleDeleteImage(editingSupplier.id, index)}>删除</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="form-actions">
                    <button onClick={handleSaveSupplier}>保存</button>
                    <button onClick={() => setEditingSupplier(null)}>取消</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="welcome">
              <h2>欢迎使用供应商数据库系统</h2>
              <p>请从左侧选择一个分类查看供应商信息</p>
            </div>
          )}
        </main>
      </div>

      {/* 供应商详情弹窗 */}
      {showDetails && selectedSupplier && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedSupplier.name} - 详情</h3>
              <button className="close-btn" onClick={() => setShowDetails(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="supplier-info">
                <p><strong>公司名称：</strong>{selectedSupplier.name}</p>
                <p><strong>联系方式：</strong>{selectedSupplier.contact}</p>
                <p><strong>联系人：</strong>{selectedSupplier.contactPerson}</p>
                <p><strong>主要业务：</strong>{selectedSupplier.business}</p>
                <p><strong>是否包工：</strong>{selectedSupplier.isContractor ? '是' : '否'}</p>
                <p><strong>备注：</strong>{selectedSupplier.note}</p>
              </div>
              <div className="supplier-images">
                <h4>图片</h4>
                {selectedSupplier.images && selectedSupplier.images.length > 0 ? (
                  <div className="image-gallery">
                    {selectedSupplier.images.map((image, index) => (
                      <div key={index} className="gallery-image">
                        <img 
                          src={image.url} 
                          alt={`Image ${index + 1}`} 
                          onClick={() => handleImageClick(image.url)}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>暂无图片</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDetails(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* 全屏图片查看 */}
      {fullscreenImage && (
        <div className="fullscreen-overlay" onClick={() => setFullscreenImage(null)}>
          <div className="fullscreen-image-container">
            <img 
              src={fullscreenImage} 
              alt="Fullscreen view" 
              className="fullscreen-image"
            />
            <button className="fullscreen-close" onClick={() => setFullscreenImage(null)}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;