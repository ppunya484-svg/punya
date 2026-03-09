// =====================================================
// Hospital Dashboard JS
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    const user = requireAuth(['hospital']);
    if (!user) return;
    loadHospitalProfile();
});

async function loadHospitalProfile() {
    try {
        const data = await apiFetch('/hospitals/my-profile');
        displayHospitalProfile(data.hospital);
        loadPendingDonors();
        loadOrganRequests();
    } catch (error) {
        if (error.status === 404) {
            document.getElementById('profile-section').classList.add('hidden');
            document.getElementById('registration-section').classList.remove('hidden');
        }
    }
}

function displayHospitalProfile(hospital) {
    document.getElementById('registration-section').classList.add('hidden');
    document.getElementById('profile-section').classList.remove('hidden');
    document.getElementById('management-section').classList.remove('hidden');

    document.getElementById('hospital-name').textContent = hospital.hospital_name;
    document.getElementById('hospital-contact').textContent = hospital.contact_name;
    document.getElementById('hospital-email').textContent = hospital.email;
    document.getElementById('hospital-license').textContent = hospital.license_no;
    document.getElementById('hospital-phone').textContent = hospital.phone;
    document.getElementById('hospital-city').textContent = hospital.city;
    document.getElementById('hospital-address').textContent = hospital.address;

    const statusEl = document.getElementById('hospital-status');
    statusEl.textContent = hospital.status;
    statusEl.className = `badge badge-${hospital.status === 'approved' ? 'success' : hospital.status === 'pending' ? 'warning' : 'danger'}`;

    if (hospital.status !== 'approved') {
        document.getElementById('management-section').classList.add('hidden');
    }
}

async function handleHospitalRegistration(event) {
    event.preventDefault();
    const submitBtn = event.target.querySelector('button[type="submit"]');

    const formData = {
        hospital_name: document.getElementById('reg-name').value,
        license_no: document.getElementById('reg-license').value,
        phone: document.getElementById('reg-phone').value,
        city: document.getElementById('reg-city').value,
        address: document.getElementById('reg-address').value
    };

    if (!formData.hospital_name || !formData.license_no || !formData.phone || !formData.city || !formData.address) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        await apiFetch('/hospitals', { method: 'POST', body: formData });
        showToast('Hospital registration successful!', 'success');
        setTimeout(() => loadHospitalProfile(), 1000);
    } catch (error) {
        showToast(error.message || 'Registration failed.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register Hospital';
    }
}

async function loadPendingDonors() {
    try {
        const data = await apiFetch('/donors/all');
        const container = document.getElementById('donor-verification-list');
        const donors = data.donors;

        if (donors.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No donors to verify</h3></div>';
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th><th>Blood Group</th><th>Organ</th>
                            <th>City</th><th>Status</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${donors.map(d => `
                            <tr>
                                <td>${d.name}</td>
                                <td>${d.blood_group}</td>
                                <td>${d.organ}</td>
                                <td>${d.city}</td>
                                <td><span class="badge badge-${d.status === 'approved' ? 'success' : d.status === 'pending' ? 'warning' : 'danger'}">${d.status}</span></td>
                                <td>
                                    ${d.status === 'pending' ? `
                                        <button onclick="updateDonorStatus(${d.id}, 'approved')" class="btn btn-sm btn-primary">Approve</button>
                                        <button onclick="updateDonorStatus(${d.id}, 'rejected')" class="btn btn-sm btn-danger">Reject</button>
                                    ` : '—'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;
    } catch (error) {
        console.error('Load donors error:', error);
    }
}

async function updateDonorStatus(donorId, status) {
    try {
        await apiFetch(`/donors/${donorId}/status`, {
            method: 'PUT',
            body: { status }
        });
        showToast(`Donor ${status} successfully!`, 'success');
        loadPendingDonors();
    } catch (error) {
        showToast(error.message || 'Update failed.', 'error');
    }
}

async function loadOrganRequests() {
    try {
        const data = await apiFetch('/patients/organ-requests/all');
        const container = document.getElementById('organ-requests-list');

        if (data.requests.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No organ requests</h3></div>';
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Patient</th><th>Organ</th><th>Blood Group</th>
                            <th>Urgency</th><th>Status</th><th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.requests.map(r => `
                            <tr>
                                <td>${r.patient_name}</td>
                                <td>${r.organ_type}</td>
                                <td>${r.blood_group}</td>
                                <td><span class="badge badge-${r.urgency === 'critical' ? 'danger' : r.urgency === 'high' ? 'warning' : 'info'}">${r.urgency}</span></td>
                                <td><span class="badge badge-${r.status === 'matched' ? 'success' : 'warning'}">${r.status}</span></td>
                                <td>
                                    ${r.status === 'open' ? `
                                        <button onclick="runMatching(${r.id})" class="btn btn-sm btn-primary">🔍 Find Donors</button>
                                    ` : `<a href="/matching-results.html" class="btn btn-sm btn-outline">View Matches</a>`}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;
    } catch (error) {
        console.error('Load organ requests error:', error);
    }
}

async function runMatching(requestId) {
    try {
        const data = await apiFetch(`/matches/find/${requestId}`, { method: 'POST' });
        if (data.count > 0) {
            showToast(`Found ${data.count} matching donor(s)!`, 'success');
        } else {
            showToast('No matching donors found.', 'info');
        }
        loadOrganRequests();
    } catch (error) {
        showToast(error.message || 'Matching failed.', 'error');
    }
}
