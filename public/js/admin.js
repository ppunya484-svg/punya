// =====================================================
// Admin Dashboard JS
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    const user = requireAuth(['admin']);
    if (!user) return;
    loadDashboardStats();
    loadAllUsers();
    loadPendingApprovals();
});

async function loadDashboardStats() {
    try {
        const data = await apiFetch('/admin/stats');
        const stats = data.stats;

        document.getElementById('stat-users').textContent = stats.total_users;
        document.getElementById('stat-donors').textContent = stats.total_donors;
        document.getElementById('stat-patients').textContent = stats.total_patients;
        document.getElementById('stat-hospitals').textContent = stats.total_hospitals;
        document.getElementById('stat-requests').textContent = stats.total_requests;
        document.getElementById('stat-matches').textContent = stats.total_matches;
        document.getElementById('stat-pending-donors').textContent = stats.pending_donors;
        document.getElementById('stat-pending-hospitals').textContent = stats.pending_hospitals;

        // Recent users
        const recentContainer = document.getElementById('recent-users');
        if (data.recent_users.length > 0) {
            recentContainer.innerHTML = data.recent_users.map(u => `
                <div class="card" style="margin-bottom: 0.75rem; padding: 1rem;">
                    <div class="flex-between">
                        <div>
                            <strong>${u.name}</strong>
                            <span style="color: var(--text-muted); font-size: 0.85rem;"> — ${u.email}</span>
                        </div>
                        <span class="badge badge-info">${u.role}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Dashboard stats error:', error);
        showToast('Failed to load dashboard stats.', 'error');
    }
}

async function loadAllUsers() {
    try {
        const roleFilter = document.getElementById('user-role-filter');
        const role = roleFilter ? roleFilter.value : '';
        const endpoint = role ? `/admin/users?role=${role}` : '/admin/users';
        const data = await apiFetch(endpoint);
        const container = document.getElementById('users-table-body');

        container.innerHTML = data.users.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td><span class="badge badge-info">${u.role}</span></td>
                <td>${new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                    ${u.role !== 'admin' ? `
                        <button onclick="deleteUser(${u.id}, '${u.name}')" class="btn btn-sm btn-danger">Delete</button>
                    ` : '<span class="badge badge-success">Admin</span>'}
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Load users error:', error);
    }
}

async function deleteUser(userId, userName) {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This cannot be undone.`)) return;

    try {
        await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
        showToast('User deleted successfully.', 'success');
        loadAllUsers();
        loadDashboardStats();
    } catch (error) {
        showToast(error.message || 'Delete failed.', 'error');
    }
}

async function loadPendingApprovals() {
    try {
        const data = await apiFetch('/admin/pending');
        const container = document.getElementById('pending-list');

        if (data.total_pending === 0) {
            container.innerHTML = '<div class="empty-state"><div class="icon">✅</div><h3>No pending approvals</h3></div>';
            return;
        }

        let html = '';

        // Pending Donors
        if (data.pending_donors.length > 0) {
            html += `<h3 class="mb-2">🩸 Pending Donors</h3>`;
            html += data.pending_donors.map(d => `
                <div class="card" style="margin-bottom: 0.75rem;">
                    <div class="flex-between">
                        <div>
                            <strong>${d.name}</strong> — ${d.blood_group} — ${d.organ}
                            <div style="color: var(--text-muted); font-size: 0.85rem;">
                                ${d.city} | Age: ${d.age} | ${d.gender}
                            </div>
                        </div>
                        <div class="flex gap-1">
                            <button onclick="approveDonor(${d.id})" class="btn btn-sm btn-primary">Approve</button>
                            <button onclick="rejectDonor(${d.id})" class="btn btn-sm btn-danger">Reject</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Pending Hospitals
        if (data.pending_hospitals.length > 0) {
            html += `<h3 class="mb-2 mt-3">🏥 Pending Hospitals</h3>`;
            html += data.pending_hospitals.map(h => `
                <div class="card" style="margin-bottom: 0.75rem;">
                    <div class="flex-between">
                        <div>
                            <strong>${h.hospital_name}</strong>
                            <div style="color: var(--text-muted); font-size: 0.85rem;">
                                License: ${h.license_no} | ${h.city} | ${h.phone}
                            </div>
                        </div>
                        <div class="flex gap-1">
                            <button onclick="approveHospital(${h.id})" class="btn btn-sm btn-primary">Approve</button>
                            <button onclick="rejectHospital(${h.id})" class="btn btn-sm btn-danger">Reject</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        container.innerHTML = html;
    } catch (error) {
        console.error('Load pending error:', error);
    }
}

async function approveDonor(id) {
    try {
        await apiFetch(`/donors/${id}/status`, { method: 'PUT', body: { status: 'approved' } });
        showToast('Donor approved!', 'success');
        loadPendingApprovals();
        loadDashboardStats();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function rejectDonor(id) {
    try {
        await apiFetch(`/donors/${id}/status`, { method: 'PUT', body: { status: 'rejected' } });
        showToast('Donor rejected.', 'info');
        loadPendingApprovals();
        loadDashboardStats();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function approveHospital(id) {
    try {
        await apiFetch(`/hospitals/${id}/verify`, { method: 'PUT', body: { status: 'approved' } });
        showToast('Hospital approved!', 'success');
        loadPendingApprovals();
        loadDashboardStats();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function rejectHospital(id) {
    try {
        await apiFetch(`/hospitals/${id}/verify`, { method: 'PUT', body: { status: 'rejected' } });
        showToast('Hospital rejected.', 'info');
        loadPendingApprovals();
        loadDashboardStats();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Run matching for all open requests
async function runAllMatching() {
    try {
        const data = await apiFetch('/patients/organ-requests/all');
        const openRequests = data.requests.filter(r => r.status === 'open');

        if (openRequests.length === 0) {
            showToast('No open requests to match.', 'info');
            return;
        }

        let matchCount = 0;
        for (const req of openRequests) {
            const result = await apiFetch(`/matches/find/${req.id}`, { method: 'POST' });
            matchCount += result.count;
        }

        showToast(`Matching complete! ${matchCount} match(es) found.`, 'success');
    } catch (error) {
        showToast(error.message || 'Matching failed.', 'error');
    }
}
