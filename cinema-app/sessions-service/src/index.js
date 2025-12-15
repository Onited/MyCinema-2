require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const sessionRoutes = require('./routes/sessionRoutes');
const reservationRoutes = require('./routes/reservationRoutes');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'sessions-service' });
});

// Routes
app.use('/api/sessions', sessionRoutes);
app.use('/api/reservations', reservationRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Sessions service running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        app.listen(PORT, () => {
            console.log(`Sessions service running on port ${PORT} (DB disconnected)`);
        });
    });

module.exports = app;
