// 路由（注意：在 Vercel 中不需要 /api 前缀，因为 vercel.json 已经配置了路由）
app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);
app.use('/suppliers', supplierRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
