// =====================================================
// Hospital Routes - CRUD operations for hospitals
// =====================================================
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

/**
 * POST /api/hospitals
 * Register a hospital profile
 */
router.post('/', verifyToken, authorizeRoles('hospital'), async (req, res) => {
    try {
        const { hospital_name, license_no, phone, city, address } = req.body;

        // Validation
        if (!hospital_name || !license_no || !phone || !city || !address) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Check if hospital profile already exists
        const [existing] = await pool.query('SELECT id FROM hospitals WHERE user_id = ?', [req.user.id]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Hospital profile already exists.' });
        }

        // Check unique license number
        const [licenseCheck] = await pool.query('SELECT id FROM hospitals WHERE license_no = ?', [license_no]);
        if (licenseCheck.length > 0) {
            return res.status(409).json({ message: 'License number already registered.' });
        }

        // Insert hospital record
        const [result] = await pool.query(
            `INSERT INTO hospitals (user_id, hospital_name, license_no, phone, city, address) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.user.id, hospital_name, license_no, phone, city, address]
        );

        res.status(201).json({
            message: 'Hospital registration successful! Awaiting admin approval.',
            hospital: { id: result.insertId, hospital_name, status: 'pending' }
        });

    } catch (error) {
        console.error('Hospital registration error:', error);
        res.status(500).json({ message: 'Server error during hospital registration.' });
    }
});

/**
 * GET /api/hospitals
 * Get all approved hospitals
 */
router.get('/', async (req, res) => {
    try {
        const [hospitals] = await pool.query(`
            SELECT h.*, u.name as contact_name, u.email 
            FROM hospitals h 
            JOIN users u ON h.user_id = u.id 
            WHERE h.status = 'approved'
            ORDER BY h.hospital_name ASC
        `);
        res.json({ hospitals, count: hospitals.length });
    } catch (error) {
        console.error('Get hospitals error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

/**
 * GET /api/hospitals/all
 * Get all hospitals regardless of status (admin only)
 */
router.get('/all', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const [hospitals] = await pool.query(`
            SELECT h.*, u.name as contact_name, u.email 
            FROM hospitals h 
            JOIN users u ON h.user_id = u.id 
            ORDER BY h.created_at DESC
        `);
        res.json({ hospitals, count: hospitals.length });
    } catch (error) {
        console.error('Get all hospitals error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

/**
 * GET /api/hospitals/my-profile
 * Get the logged-in hospital's profile
 */
router.get('/my-profile', verifyToken, authorizeRoles('hospital'), async (req, res) => {
    try {
        const [hospitals] = await pool.query(`
            SELECT h.*, u.name as contact_name, u.email 
            FROM hospitals h 
            JOIN users u ON h.user_id = u.id 
            WHERE h.user_id = ?
        `, [req.user.id]);

        if (hospitals.length === 0) {
            return res.status(404).json({ message: 'Hospital profile not found. Please complete registration.' });
        }

        res.json({ hospital: hospitals[0] });
    } catch (error) {
        console.error('Get hospital profile error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

/**
 * PUT /api/hospitals/:id/verify
 * Approve or reject a hospital (admin only)
 */
router.put('/:id/verify', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['approved', 'rejected'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Status must be approved or rejected.' });
        }

        const [result] = await pool.query(
            'UPDATE hospitals SET status = ? WHERE id = ?',
            [status, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Hospital not found.' });
        }

        res.json({ message: `Hospital ${status} successfully.` });
    } catch (error) {
        console.error('Verify hospital error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
