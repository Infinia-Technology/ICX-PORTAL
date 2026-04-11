const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth.routes');
const supplierRoutes = require('./routes/supplier.routes');
const customerRoutes = require('./routes/customer.routes');
const dcApplicationRoutes = require('./routes/dcApplication.routes');
const dcSiteRoutes = require('./routes/dcSite.routes');
const gpuClusterRoutes = require('./routes/gpuCluster.routes');
const gpuDemandRoutes = require('./routes/gpuDemand.routes');
const dcRequestRoutes = require('./routes/dcRequest.routes');
const adminRoutes = require('./routes/admin.routes');
const superadminRoutes = require('./routes/superadmin.routes');
const marketplaceRoutes = require('./routes/marketplace.routes');
const notificationRoutes = require('./routes/notification.routes');
const reportRoutes = require('./routes/report.routes');
const accountRoutes = require('./routes/account.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (nginx in Docker)
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/dc-applications', dcApplicationRoutes);
app.use('/api/dc-sites', dcSiteRoutes);
app.use('/api/gpu-clusters', gpuClusterRoutes);
app.use('/api/gpu-demands', gpuDemandRoutes);
app.use('/api/dc-requests', dcRequestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/account', accountRoutes);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`ICX Portal server running on port ${PORT}`);
});

module.exports = app;
