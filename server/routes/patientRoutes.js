// =====================================================
// Patient Routes - CRUD operations for patients
// =====================================================
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

/**
 * POST /api/patients
 * Register as a patient (only users with 'patient' role)
 */
router.post('/', verifyToken, authorizeRoles('patient'), async (req, res) => {
    try {
        const { blood_group, organ_needed, urgency, age, gender, phone, city, medical_condition } = req.body;

        // Validation
        if (!blood_group || !organ_needed || !age || !gender || !phone || !city) {
            return res.status(400).json({ message: 'All required fields must be filled.' });
        }

        // Valid organs
        const validOrgans = ['Kidney', 'Liver', 'Heart', 'Lungs', 'Eyes', 'Pancreas'];
        if (!validOrgans.includes(organ_needed)) {
            return res.status(400).json({ message: 'Invalid organ type.' });
        }

        // Check if patient profile already exists
        const [existing] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Patient profile already exists.' });
        }

        // Insert patient record
        const [result] = await pool.query(
            `INSERT INTO patients (user_id, blood_group, organ_needed, urgency, age, gender, phone, city, medical_condition) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, blood_group, organ_needed, urgency || 'medium', age, gender, phone, city, medical_condition || null]
        );

        res.status(201).json({
            message: 'Patient registration successful!',
            patient: { id: result.insertId, blood_group, organ_needed, status: 'waiting' }
        });

    } catch (error) {
        console.error('Patient registration error:', error);
        res.status(500).json({ message: 'Server error during patient registration.' });
    }
});

/**
 * GET /api/patients
 * Get all patients (admin/hospital only)
 */
router.get('/', verifyToken, authorizeRoles('admin', 'hospital'), async (req, res) => {
    try {
        const [patients] = await pool.query(`
            SELECT p.*, u.name, u.email 
            FROM patients p 
            JOIN users u ON p.user_id = u.id 
            ORDER BY 
                CASE p.urgency 
                    WHEN 'critical' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'medium' THEN 3 
                    WHEN 'low' THEN 4 
                END,
                p.created_at ASC
        `);
        res.json({ patients, count: patients.length });
    } catch (error) {
        console.error('Get patients error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

/**
 * GET /api/patients/my-profile
 * Get the logged-in patient's own profile
 */
router.get('/my-profile', verifyToken, authorizeRoles('patient'), async (req, res) => {
    try {
        const [patients] = await pool.query(`
            SELECT p.*, u.name, u.email 
            FROM patients p 
            JOIN users u ON p.user_id = u.id 
            WHERE p.user_id = ?
        `, [req.user.id]);

        if (patients.length === 0) {
            return res.status(404).json({ message: 'Patient profile not found. Please complete registration.' });
        }

        res.json({ patient: patients[0] });
    } catch (error) {
        console.error('Get patient profile error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

/**
 * GET /api/patients/:id
 * Get a single patient by ID
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [patients] = await pool.query(`
            SELECT p.*, u.name, u.email 
            FROM patients p 
            JOIN users u ON p.user_id = u.id 
            WHERE p.id = ?
        `, [req.params.id]);

        if (patients.length === 0) {
            return res.status(404).json({ message: 'Patient not found.' });
        }

        res.json({ patient: patients[0] });
    } catch (error) {
        console.error('Get patient error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// =====================================================
// ORGAN REQUESTS - Patients can request organs
// =====================================================

/**
 * POST /api/patients/organ-requests
 * Submit a new organ request
 */
router.post('/organ-requests', verifyToken, authorizeRoles('patient'), async (req, res) => {
    try {
        // Get patient profile
        const [patients] = await pool.query('SELECT * FROM patients WHERE user_id = ?', [req.user.id]);
        if (patients.length === 0) {
            return res.status(400).json({ message: 'Please complete your patient profile first.' });
        }

        const patient = patients[0];

        // Check for existing open request
        const [openReqs] = await pool.query(
            'SELECT id FROM organ_requests WHERE patient_id = ? AND status = "open"',
            [patient.id]
        );
        if (openReqs.length > 0) {
            return res.status(409).json({ message: 'You already have an open organ request.' });
        }

        // Create organ request using patient's profile data
        const [result] = await pool.query(
            'INSERT INTO organ_requests (patient_id, organ_type, blood_group) VALUES (?, ?, ?)',
            [patient.id, patient.organ_needed, patient.blood_group]
        );

        res.status(201).json({
            message: 'Organ request submitted successfully!',
            request: {
                id: result.insertId,
                organ_type: patient.organ_needed,
                blood_group: patient.blood_group,
                status: 'open'
            }
        });

    } catch (error) {
        console.error('Organ request error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

/**
 * GET /api/patients/organ-requests/my-requests
 * Get the logged-in patient's organ requests
 */
router.get('/organ-requests/my-requests', verifyToken, authorizeRoles('patient'), async (req, res) => {
    try {
        const [patients] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
        if (patients.length === 0) {
            return res.json({ requests: [] });
        }

        const [requests] = await pool.query(
            'SELECT * FROM organ_requests WHERE patient_id = ? ORDER BY requested_at DESC',
            [patients[0].id]
        );

        res.json({ requests });
    } catch (error) {
        console.error('Get organ requests error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

/**
 * GET /api/patients/organ-requests/all
 * Get all organ requests (admin/hospital)
 */
router.get('/organ-requests/all', verifyToken, authorizeRoles('admin', 'hospital'), async (req, res) => {
    try {
        const [requests] = await pool.query(`
            SELECT orq.*, p.blood_group as patient_blood, p.organ_needed, p.urgency,
                   u.name as patient_name, u.email as patient_email
            FROM organ_requests orq
            JOIN patients p ON orq.patient_id = p.id
            JOIN users u ON p.user_id = u.id
            ORDER BY 
                CASE p.urgency 
                    WHEN 'critical' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'medium' THEN 3 
                    WHEN 'low' THEN 4 
                END,
                orq.requested_at ASC
        `);

        res.json({ requests, count: requests.length });
    } catch (error) {
        console.error('Get all organ requests error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
