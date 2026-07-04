require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth');
const interviewRoutes = require('./routes/interview');
const practiceRoutes = require('./routes/practice');
const historyRoutes = require('./routes/history');

const app = express();

// FRONTEND_URL can be a single origin or a comma-separated list, e.g.
// "https://your-app.vercel.app,http://localhost:5173"
// Defaults to allowing the local Vite dev server if not set.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/history', historyRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Fallback error handler (e.g. multer file-type errors, CORS rejections)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong.' });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
