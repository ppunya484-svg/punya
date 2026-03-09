// =====================================================
// Donor Routes - CRUD operations for organ donors
// =====================================================
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

/**
 * POST /api/donors
 * Register as a donor (only users with 'donor' role)
 */
router.post('/', verifyToken, authorizeRoles('donor'), async (req, res) => {
    try {
        const { blood_group, organ, age, gender, phone, city, medical_history } = req.body;

        // Validation
        if (!blood_group || !organ || !age || !gender || !phone || !city) {
            return res.status(400).json({ message: 'All required fields must be filled.' });
        }

        // Valid organs
        const validOrgans = ['Kidney', 'Liver', 'Heart', 'Lungs', 'Eyes', 'Pancreas'];
        if (!validOrgans.includes(organ)) {
            return res.status(400).json({ message: 'Invalid organ type.' });
        }

        // Valid blood groups
        const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        if (!validBloodGroups.includes(blood_group)) {
            return res.status(400).json({ message: 'Invalid blood group.' });
        }

        // Check if donor profile already exists
        const [existing] = await pool.query('SELECT id FROM donors WHERE user_id = ?', [req.user.id]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Donor profile already exists.' });
        }

        // Insert donor record
        const [result] = await pool.query(
            `INSERT INTO donors (user_id, blood_group, organ, age, gender, phone, city, medical_history) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, blood_group, organ, age, gender, phone, city, medical_history || null]
        );

        res.status(201).json({
            message: 'Donor registration successful! Awaiting approval.',
            donor: { id: result.insertId, blood_group, organ, status: 'pending' }
        });

    } catch (error) {
        console.error('Donor registration error:', error);
        res.status(500).json({ message: 'Server error during donor registration.' });
    }
});

/**
 * GET /api/donors
 * Get all approved donors (public list)
 */
router.get('/', async (req, res) => {
    try {
        const { blood_group, organ, city } = req.query;

        let query = `
            SELECT d.*, u.name, u.email 
            FROM donors d 
            JOIN users u ON d.user_id = u.id 
            WHERE d.status = 'approved'
        `;
        const params = [];

        // Optional filters
        if (blood_group) {
            query += ' AND d.blood_group = ?';
            params.push(blood_group);
        }
        if (organ) {
            query += ' AND d.organ = ?';
            params.push(organ);
        }
        if (city) {
            query += ' AND d.city LIKE ?';
            params.push(`%${city}%`);
        }

        query += ' ORDER BY d.created_at DESC';

        const [donors] = await pool.query(query, params);
        res.json({ donors, count: donors.length });

    } catch (error) {
        console.error('Get donors error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

/**
 * GET /api/donors/all
 * Get all donors regardless of status (admin/hospital only)
 */
router.get('/all', verifyToken, authorizeRoles('admin', 'hospital'), async (req, res) => {
    try {
        const [donors] = await pool.query(`
            SELECT d.*, u.name, u.email 
            FROM donors d 
            JOIN users u ON d.user_id = u.id 
            ORDER BY d.created_at DESC
        `);
        res.json({ donors, count: donors.length });
    } catch (error) {
        console.error('Get all donors error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

/**
 * GET /api/donors/my-profile
 * Get the logged-in donor's own profile
 */
router.get('/my-profile', verifyToken, authorizeRoles('donor'), async (req, res) => {
    try {
        const [donors] = await pool.query(`
            SELECT d.*, u.name, u.email 
            FROM donors d 
            JOIN users u ON d.user_id = u.id 
            WHERE d.user_id = ?
        `, [req.user.id]);

        if (donors.length === 0) {
            return res.status(404).json({ message: 'Donor profile not found. Please complete registration.' });
        }

        res.json({ donor: donors[0] });
    } catch (error) {
        console.error('Get donor profile error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

/**
 * GET /api/donors/:id
 * Get a single donor by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const [donors] = await pool.query(`
            SELECT d.*, u.name, u.email 
            FROM donors d 
            JOIN users u ON d.user_id = u.id 
            WHERE d.id = ?
        `, [req.params.id]);

        if (donors.length === 0) {
            return res.status(404).json({ message: 'Donor not found.' });
        }

        res.json({ donor: donors[0] });
    } catch (error) {
        console.error('Get donor error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

/**
 * PUT /api/donors/:id/status
 * Update donor approval status (admin/hospital only)
 */
router.put('/:id/status', verifyToken, authorizeRoles('admin', 'hospital'), async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'approved', 'rejected'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status.' });
        }

        const [result] = await pool.query(
            'UPDATE donors SET status = ? WHERE id = ?',
            [status, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Donor not found.' });
        }

        res.json({ message: `Donor status updated to ${status}.` });
    } catch (error) {
        console.error('Update donor status error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
