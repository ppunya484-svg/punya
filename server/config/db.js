// =====================================================
// MySQL Database Connection Pool
// =====================================================
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'organ_donation_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,        // Maximum number of connections in pool
    queueLimit: 0               // Unlimited queueing
});

// Test the connection
pool.getConnection()
    .then(conn => {
        console.log('✅ MySQL Database connected successfully');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });

module.exports = pool;
