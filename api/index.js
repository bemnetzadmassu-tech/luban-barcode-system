const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));
app.get('/api/debug-env', (req, res) => {
    res.json({
        hasAdminPassword: !!process.env.ADMIN_PASSWORD,
        adminPasswordLength: process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.length : 0,
        hasJwtSecret: !!process.env.JWT_SECRET
    });
});
// Import route handlers
const generateHandler = require('./generate');
const assignOriginHandler = require('./assign-origin');
const verifyHandler = require('./verify');
const soldHandler = require('./sold');
const barcodesHandler = require('./barcodes');
const statsHandler = require('./stats');

// Auth endpoints
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) return res.status(500).json({ error: 'Admin password not set' });
    if (password === expected) {
        const token = jwt.sign({ admin: true }, process.env.JWT_SECRET, { expiresIn: '24h' });
        return res.json({ success: true, token });
    }
    res.status(401).json({ error: 'Invalid password' });
});

// API routes
app.post('/api/generate', (req, res) => generateHandler(req, res));
app.post('/api/assign-origin', (req, res) => assignOriginHandler(req, res));
app.get('/api/verify/:barcode', (req, res) => verifyHandler(req, res));
app.post('/api/sold', (req, res) => soldHandler(req, res));
app.get('/api/barcodes', (req, res) => barcodesHandler(req, res));
app.get('/api/stats', (req, res) => statsHandler(req, res));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Catch-all for SPA
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    }
});

module.exports = app;
