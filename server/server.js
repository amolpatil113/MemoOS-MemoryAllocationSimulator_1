require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const algorithmRoutes = require('./routes/algorithmRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/algorithms', algorithmRoutes);
app.use('/api', sessionRoutes);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/memsim';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));
