-- =====================================================
-- Organ Donation Management System - Database Schema
-- =====================================================

CREATE DATABASE IF NOT EXISTS organ_donation_db;
USE organ_donation_db;

-- ---------------------------------------------------
-- 1. USERS TABLE (all user types share this table)
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'donor', 'patient', 'hospital') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------
-- 2. DONORS TABLE
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS donors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    organ VARCHAR(20) NOT NULL,
    age INT NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    phone VARCHAR(15) NOT NULL,
    city VARCHAR(100) NOT NULL,
    medical_history TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------
-- 3. PATIENTS TABLE
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    organ_needed VARCHAR(20) NOT NULL,
    urgency ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    age INT NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    phone VARCHAR(15) NOT NULL,
    city VARCHAR(100) NOT NULL,
    medical_condition TEXT,
    status ENUM('waiting', 'matched', 'transplanted') DEFAULT 'waiting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------
-- 4. HOSPITALS TABLE
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS hospitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    hospital_name VARCHAR(200) NOT NULL,
    license_no VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------
-- 5. ORGAN REQUESTS TABLE
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS organ_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    organ_type VARCHAR(20) NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    status ENUM('open', 'matched', 'closed') DEFAULT 'open',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- ---------------------------------------------------
-- 6. MATCHES TABLE
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    donor_id INT NOT NULL,
    hospital_id INT DEFAULT NULL,
    status ENUM('pending', 'approved', 'completed', 'rejected') DEFAULT 'pending',
    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES organ_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL
);

-- ---------------------------------------------------
-- INDEXES for performance
-- ---------------------------------------------------
CREATE INDEX idx_donors_blood_organ ON donors(blood_group, organ);
CREATE INDEX idx_patients_blood_organ ON patients(blood_group, organ_needed);
CREATE INDEX idx_organ_requests_status ON organ_requests(status);
CREATE INDEX idx_matches_status ON matches(status);

-- ---------------------------------------------------
-- SEED: Default Admin User
-- Password: admin123 (bcrypt hash)
-- ---------------------------------------------------
INSERT INTO users (name, email, password, role) VALUES
('System Admin', 'admin@admin.com', '$2b$10$4qKQ53KtO.DcbiRVpVP4n.dyftAf1CEtV9ziWogOO0mUaqPMhwHz2', 'admin');

-- =====================================================
-- SAMPLE QUERIES (for reference / Postman testing)
-- =====================================================

-- Get all approved donors
-- SELECT d.*, u.name, u.email FROM donors d JOIN users u ON d.user_id = u.id WHERE d.status = 'approved';

-- Get matching donors for a blood group and organ
-- SELECT d.*, u.name FROM donors d JOIN users u ON d.user_id = u.id WHERE d.blood_group = 'O+' AND d.organ = 'Kidney' AND d.status = 'approved';

-- Dashboard stats
-- SELECT role, COUNT(*) as count FROM users GROUP BY role;
-- SELECT status, COUNT(*) as count FROM organ_requests GROUP BY status;
