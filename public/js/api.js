// =====================================================
// API Helper - Shared fetch wrapper
// Automatically attaches JWT token from localStorage
// =====================================================

const API_BASE = '/api';

/**
 * Make an API request with automatic JWT token attachment
 * @param {string} endpoint - API endpoint (e.g. '/auth/login')
 * @param {object} options - Fetch options (method, body, etc.)
 * @returns {Promise<object>} Parsed JSON response
 */
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        },
        ...options
    };

    // If body is an object, stringify it
    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw { status: response.status, message: data.message || 'Request failed' };
        }

        return data;
    } catch (error) {
        if (error.status === 401 || error.status === 403) {
            // Token expired or invalid - redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (!window.location.pathname.includes('login')) {
                window.location.href = '/login.html';
            }
        }
        throw error;
    }
}

/**
 * Get current user from localStorage
 */
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

/**
 * Logout user
 */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // Remove after animation
    setTimeout(() => toast.remove(), 3500);
}

/**
 * Update navigation based on login state
 */
function updateNavigation() {
    const user = getCurrentUser();
    const navAuth = document.querySelector('.nav-auth');
    const navLinks = document.querySelector('.nav-links');

    if (!navAuth) return;

    if (user) {
        // Show dashboard link and logout
        navAuth.innerHTML = `
            <span style="color: var(--text-secondary); font-size: 0.85rem;">
                👋 ${user.name}
            </span>
            <a href="/${user.role === 'admin' ? 'admin' : user.role}-dashboard.html" class="btn btn-outline btn-sm">
                Dashboard
            </a>
            <button onclick="logout()" class="btn btn-sm" style="background: rgba(239,68,68,0.2); color: #f87171;">
                Logout
            </button>
        `;
    } else {
        navAuth.innerHTML = `
            <a href="/login.html" class="btn btn-outline btn-sm">Login</a>
            <a href="/register.html" class="btn btn-primary btn-sm">Register</a>
        `;
    }

    // Setup hamburger toggle
    const hamburger = document.querySelector('.hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }
}

/**
 * Require authentication - redirect to login if not logged in
 */
function requireAuth(allowedRoles = []) {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return null;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        showToast('Access denied. Insufficient permissions.', 'error');
        window.location.href = '/';
        return null;
    }
    return user;
}

// Update nav on every page load
document.addEventListener('DOMContentLoaded', updateNavigation);
