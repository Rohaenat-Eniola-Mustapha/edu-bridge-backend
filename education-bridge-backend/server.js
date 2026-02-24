const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const lessonRoutes = require('./src/routes/lessons');
const progressRoutes = require('./src/routes/progress');
const syncRoutes = require('./src/routes/sync');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/sync', syncRoutes);

app.get('/', (req, res) => {
  res.send('Education Bridge API');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});