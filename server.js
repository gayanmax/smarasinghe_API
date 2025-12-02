const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();


const authRoutes = require('./routes/authRoutes');
const customerJobRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/authRoutes');

const app = express();
app.use(bodyParser.json());

// Routes
app.use('/api', authRoutes);
app.use('/api', customerJobRoutes);
app.use('/api', customerRoutes);


// const PORT = process.env.PORT || 3000;
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

