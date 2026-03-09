// =====================================================
// Express Server Entry Point
// Organ Donation Management System
// =====================================================
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ---- Middleware ----
app.use(cors());                                          // Enable CORS for all origins
app.use(express.json());                                  // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));          // Parse URL-encoded bodies
app.use(express.static(path.join(__dirname, '../public'))); // Serve frontend files

// ---- API Routes ----
const authRoutes = require('./routes/authRoutes');
const donorRoutes = require('./routes/donorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const matchRoutes = require('./routes/matchRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/admin', adminRoutes);

// ---- Health Check ----
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Organ Donation System API is running' });
});

// ---- Catch-all: serve index.html for unknown routes ----
app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ---- Error handling middleware ----
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

// ---- Start Server ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════╗
    ║   Organ Donation Management System            ║
    ║   Server running on http://localhost:${PORT}      ║
    ║   API Base: http://localhost:${PORT}/api          ║
    ╚═══════════════════════════════════════════════╝
    `);
});
