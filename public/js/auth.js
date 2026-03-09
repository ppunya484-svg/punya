// =====================================================
// Authentication JS - Login & Register
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect to dashboard
    const user = getCurrentUser();
    if (user && window.location.pathname.includes('login')) {
        redirectToDashboard(user.role);
        return;
    }
});

/**
 * Handle Login Form Submission
 */
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');

    // Basic validation
    if (!email || !password) {
        showToast('Please fill in all fields.', 'error');
        return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';

        const data = await apiFetch('/auth/login', {
            method: 'POST',
            body: { email, password }
        });

        // Save token and user to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        showToast('Login successful! Redirecting...', 'success');

        // Redirect to appropriate dashboard
        setTimeout(() => redirectToDashboard(data.user.role), 1000);

    } catch (error) {
        showToast(error.message || 'Login failed. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
}

/**
 * Handle Registration Form Submission
 */
async function handleRegister(event) {
    event.preventDefault();

    const activeTab = document.querySelector('.tab-content.active');
    const role = activeTab.id.replace('-form', '');

    const name = document.getElementById(`${role}-name`).value.trim();
    const email = document.getElementById(`${role}-email`).value.trim();
    const password = document.getElementById(`${role}-password`).value;
    const confirmPassword = document.getElementById(`${role}-confirm-password`).value;
    const submitBtn = activeTab.querySelector('button[type="submit"]');

    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showToast('Please fill in all fields.', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';

        const data = await apiFetch('/auth/register', {
            method: 'POST',
            body: { name, email, password, role }
        });

        // Save token and user
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        showToast('Registration successful! Redirecting...', 'success');

        setTimeout(() => redirectToDashboard(data.user.role), 1000);

    } catch (error) {
        showToast(error.message || 'Registration failed.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register';
    }
}

/**
 * Switch registration tabs
 */
function switchTab(tabName) {
    // Remove active from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active to clicked tab
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-form`).classList.add('active');
}

/**
 * Redirect to role-specific dashboard
 */
function redirectToDashboard(role) {
    switch (role) {
        case 'admin':
            window.location.href = '/admin-dashboard.html';
            break;
        case 'donor':
            window.location.href = '/donor-dashboard.html';
            break;
        case 'patient':
            window.location.href = '/patient-dashboard.html';
            break;
        case 'hospital':
            window.location.href = '/hospital-dashboard.html';
            break;
        default:
            window.location.href = '/';
    }
}
