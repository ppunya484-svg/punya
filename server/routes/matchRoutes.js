// =====================================================
// Match Routes - Organ Matching Algorithm
// =====================================================
// This module implements the core matching logic:
// 1. Takes an open organ request (organ type + blood group)
// 2. Finds approved donors with matching organ AND compatible blood group
// 3. Ranks results by blood group compatibility
// 4. Creates match records in the database
// =====================================================
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

/**
 * BLOOD GROUP COMPATIBILITY TABLE
 * Maps each blood group to the blood groups it can receive from
 * This is a simplified medical reference for organ transplant matching
 */
const bloodCompatibility = {
    'O-': ['O-'],
    'O+': ['O-', 'O+'],
    'A-': ['O-', 'A-'],
    'A+': ['O-', 'O+', 'A-', 'A+'],
    'B-': ['O-', 'B-'],
    'B+': ['O-', 'O+', 'B-', 'B+'],
    'AB-': ['O-', 'A-', 'B-', 'AB-'],
    'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']  // Universal receiver
};

/**
 * Calculate compatibility score (0-100)
 * Higher score = better match
 */
function calculateCompatibilityScore(donorBlood, patientBlood) {
    // Exact match = highest score
    if (donorBlood === patientBlood) return 100;

    // Compatible but not exact
    const compatible = bloodCompatibility[patientBlood] || [];
    if (compatible.includes(donorBlood)) return 75;

    // Not compatible
    return 0;
}

/**
 * POST /api/matches/find/:requestId
 * Run the matching algorithm for a specific organ request
 * Only admin or hospital can trigger matching
 */
router.post('/find/:requestId', verifyToken, authorizeRoles('admin', 'hospital'), async (req, res) => {
    try {
        const { requestId } = req.params;

        // 1. Get the organ request details
        const [requests] = await pool.query(`
            SELECT orq.*, p.urgency, p.city as patient_city, u.name as patient_name
            FROM organ_requests orq
            JOIN patients p ON orq.patient_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE orq.id = ? AND orq.status = 'open'
        `, [requestId]);

        if (requests.length === 0) {
            return res.status(404).json({ message: 'Open organ request not found.' });
        }

        const request = requests[0];
        const compatibleBloodGroups = bloodCompatibility[request.blood_group] || [request.blood_group];

        // 2. Find approved donors with matching organ AND compatible blood group
        const [donors] = await pool.query(`
            SELECT d.*, u.name as donor_name, u.email as donor_email
            FROM donors d
            JOIN users u ON d.user_id = u.id
            WHERE d.organ = ?
            AND d.blood_group IN (?)
            AND d.status = 'approved'
            ORDER BY 
                CASE WHEN d.blood_group = ? THEN 0 ELSE 1 END,
                d.created_at ASC
        `, [request.organ_type, compatibleBloodGroups, request.blood_group]);

        if (donors.length === 0) {
            return res.json({
                message: 'No matching donors found.',
                request: request,
                matches: [],
                count: 0
            });
        }

        // 3. Calculate compatibility scores and create match records
        const matchResults = [];
        for (const donor of donors) {
            const score = calculateCompatibilityScore(donor.blood_group, request.blood_group);

            // Check if this match already exists
            const [existingMatch] = await pool.query(
                'SELECT id FROM matches WHERE request_id = ? AND donor_id = ?',
                [requestId, donor.id]
            );

            if (existingMatch.length === 0) {
                // Create match record
                const [matchResult] = await pool.query(
                    'INSERT INTO matches (request_id, donor_id) VALUES (?, ?)',
                    [requestId, donor.id]
                );

                matchResults.push({
                    match_id: matchResult.insertId,
                    donor_id: donor.id,
                    donor_name: donor.donor_name,
                    donor_blood_group: donor.blood_group,
                    donor_organ: donor.organ,
                    donor_city: donor.city,
                    donor_age: donor.age,
                    compatibility_score: score,
                    status: 'pending'
                });
            }
        }

        // 4. Update request status to 'matched' if matches found
        if (matchResults.length > 0) {
            await pool.query(
                'UPDATE organ_requests SET status = "matched" WHERE id = ?',
                [requestId]
            );
        }

        res.json({
            message: `Found ${matchResults.length} matching donor(s)!`,
            request: {
                id: request.id,
                patient_name: request.patient_name,
                organ_type: request.organ_type,
                blood_group: request.blood_group,
                urgency: request.urgency
            },
            matches: matchResults,
            count: matchResults.length
        });

    } catch (error) {
        console.error('Matching error:', error);
        res.status(500).json({ message: 'Server error during matching.' });
    }
});

/**
 * GET /api/matches
 * Get all matches (admin/hospital)
 */
router.get('/', verifyToken, authorizeRoles('admin', 'hospital'), async (req, res) => {
    try {
        const [matches] = await pool.query(`
            SELECT m.*, 
                   orq.organ_type, orq.blood_group as request_blood_group,
                   d.blood_group as donor_blood_group, d.organ as donor_organ, d.city as donor_city,
                   du.name as donor_name,
                   pu.name as patient_name,
                   p.urgency,
                   h.hospital_name
            FROM matches m
            JOIN organ_requests orq ON m.request_id = orq.id
            JOIN donors d ON m.donor_id = d.id
            JOIN users du ON d.user_id = du.id
            JOIN patients p ON orq.patient_id = p.id
            JOIN users pu ON p.user_id = pu.id
            LEFT JOIN hospitals h ON m.hospital_id = h.id
            ORDER BY m.matched_at DESC
        `);

        // Add compatibility scores
        const enrichedMatches = matches.map(match => ({
            ...match,
            compatibility_score: calculateCompatibilityScore(match.donor_blood_group, match.request_blood_group)
        }));

        res.json({ matches: enrichedMatches, count: enrichedMatches.length });
    } catch (error) {
        console.error('Get matches error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

/**
 * PUT /api/matches/:id/status
 * Update match status (approve, complete, or reject)
 */
router.put('/:id/status', verifyToken, authorizeRoles('admin', 'hospital'), async (req, res) => {
    try {
        const { status, hospital_id } = req.body;
        const validStatuses = ['pending', 'approved', 'completed', 'rejected'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status.' });
        }

        let query = 'UPDATE matches SET status = ?';
        const params = [status];

        // Optionally assign a hospital
        if (hospital_id) {
            query += ', hospital_id = ?';
            params.push(hospital_id);
        }

        query += ' WHERE id = ?';
        params.push(req.params.id);

        const [result] = await pool.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Match not found.' });
        }

        // If match is completed, update patient status
        if (status === 'completed') {
            const [matchData] = await pool.query(`
                SELECT orq.patient_id FROM matches m 
                JOIN organ_requests orq ON m.request_id = orq.id 
                WHERE m.id = ?
            `, [req.params.id]);

            if (matchData.length > 0) {
                await pool.query(
                    'UPDATE patients SET status = "transplanted" WHERE id = ?',
                    [matchData[0].patient_id]
                );
                await pool.query(
                    'UPDATE organ_requests SET status = "closed" WHERE patient_id = ?',
                    [matchData[0].patient_id]
                );
            }
        }

        res.json({ message: `Match status updated to ${status}.` });
    } catch (error) {
        console.error('Update match status error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
