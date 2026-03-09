// =====================================================
// Admin Routes - Dashboard & Management
// =====================================================
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// All admin routes require admin role
router.use(verifyToken, authorizeRoles('admin'));

/**
 * GET /api/admin/stats
 * Dashboard statistics - counts of all entities
 */
router.get('/stats', async (req, res) => {
    try {
        // Get counts for dashboard cards
        const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
        const [donorCount] = await pool.query('SELECT COUNT(*) as count FROM donors');
        const [patientCount] = await pool.query('SELECT COUNT(*) as count FROM patients');
        const [hospitalCount] = await pool.query('SELECT COUNT(*) as count FROM hospitals');
        const [requestCount] = await pool.query('SELECT COUNT(*) as count FROM organ_requests');
        const [matchCount] = await pool.query('SELECT COUNT(*) as count FROM matches');

        // Get pending approvals count
        const [pendingDonors] = await pool.query("SELECT COUNT(*) as count FROM donors WHERE status = 'pending'");
        const [pendingHospitals] = await pool.query("SELECT COUNT(*) as count FROM hospitals WHERE status = 'pending'");

        // Get organ-wise donor distribution
        const [organStats] = await pool.query(`
            SELECT organ, COUNT(*) as count 
            FROM donors 
            WHERE status = 'approved' 
            GROUP BY organ
        `);

        // Get blood group distribution
        const [bloodStats] = await pool.query(`
            SELECT blood_group, COUNT(*) as count 
            FROM donors 
            WHERE status = 'approved' 
            GROUP BY blood_group
        `);

        // Recent activity
        const [recentUsers] = await pool.query(`
            SELECT name, email, role, created_at 
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        res.json({
            stats: {
                total_users: userCount[0].count,
                total_donors: donorCount[0].count,
                total_patients: patientCount[0].count,
                total_hospitals: hospitalCount[0].count,
                total_requests: requestCount[0].count,
                total_matches: matchCount[0].count,
                pending_donors: pendingDonors[0].count,
                pending_hospitals: pendingHospitals[0].count
            },
            organ_distribution: organStats,
            blood_distribution: bloodStats,
            recent_users: recentUsers
        });

    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

/**
 * GET /api/admin/users
 * List all users in the system
 */
router.get('/users', async (req, res) => {
    try {
        const { role } = req.query;
        let query = 'SELECT id, name, email, role, created_at FROM users';
        const params = [];

        if (role) {
            query += ' WHERE role = ?';
            params.push(role);
        }

        query += ' ORDER BY created_at DESC';

        const [users] = await pool.query(query, params);
        res.json({ users, count: users.length });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user (cascades to related records)
 */
router.delete('/users/:id', async (req, res) => {
    try {
        // Prevent admin from deleting themselves
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own account.' });
        }

        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

/**
 * GET /api/admin/pending
 * Get all pending approvals (donors + hospitals)
 */
router.get('/pending', async (req, res) => {
    try {
        const [pendingDonors] = await pool.query(`
            SELECT d.*, u.name, u.email, 'donor' as type
            FROM donors d 
            JOIN users u ON d.user_id = u.id 
            WHERE d.status = 'pending'
            ORDER BY d.created_at ASC
        `);

        const [pendingHospitals] = await pool.query(`
            SELECT h.*, u.name as contact_name, u.email, 'hospital' as type
            FROM hospitals h 
            JOIN users u ON h.user_id = u.id 
            WHERE h.status = 'pending'
            ORDER BY h.created_at ASC
        `);

        res.json({
            pending_donors: pendingDonors,
            pending_hospitals: pendingHospitals,
            total_pending: pendingDonors.length + pendingHospitals.length
        });
    } catch (error) {
        console.error('Get pending error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
