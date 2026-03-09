// =====================================================
// Patient Dashboard JS
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    const user = requireAuth(['patient']);
    if (!user) return;
    loadPatientProfile();
});

async function loadPatientProfile() {
    try {
        const data = await apiFetch('/patients/my-profile');
        displayPatientProfile(data.patient);
        loadMyRequests();
    } catch (error) {
        if (error.status === 404) {
            document.getElementById('profile-section').classList.add('hidden');
            document.getElementById('registration-section').classList.remove('hidden');
        }
    }
}

function displayPatientProfile(patient) {
    document.getElementById('registration-section').classList.add('hidden');
    document.getElementById('profile-section').classList.remove('hidden');
    document.getElementById('request-section').classList.remove('hidden');

    document.getElementById('patient-name').textContent = patient.name;
    document.getElementById('patient-email').textContent = patient.email;
    document.getElementById('patient-blood').textContent = patient.blood_group;
    document.getElementById('patient-organ').textContent = patient.organ_needed;
    document.getElementById('patient-urgency').textContent = patient.urgency;
    document.getElementById('patient-age').textContent = patient.age;
    document.getElementById('patient-city').textContent = patient.city;

    const statusEl = document.getElementById('patient-status');
    statusEl.textContent = patient.status;
    statusEl.className = `badge badge-${patient.status === 'matched' ? 'success' : patient.status === 'waiting' ? 'warning' : 'info'}`;
}

async function handlePatientRegistration(event) {
    event.preventDefault();
    const submitBtn = event.target.querySelector('button[type="submit"]');

    const formData = {
        blood_group: document.getElementById('reg-blood').value,
        organ_needed: document.getElementById('reg-organ').value,
        urgency: document.getElementById('reg-urgency').value,
        age: parseInt(document.getElementById('reg-age').value),
        gender: document.getElementById('reg-gender').value,
        phone: document.getElementById('reg-phone').value,
        city: document.getElementById('reg-city').value,
        medical_condition: document.getElementById('reg-condition').value
    };

    if (!formData.blood_group || !formData.organ_needed || !formData.age || !formData.gender || !formData.phone || !formData.city) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        await apiFetch('/patients', { method: 'POST', body: formData });
        showToast('Patient registration successful!', 'success');
        setTimeout(() => loadPatientProfile(), 1000);
    } catch (error) {
        showToast(error.message || 'Registration failed.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register as Patient';
    }
}

async function submitOrganRequest() {
    const btn = document.getElementById('request-btn');
    try {
        btn.disabled = true;
        btn.textContent = 'Submitting...';
        await apiFetch('/patients/organ-requests', { method: 'POST' });
        showToast('Organ request submitted successfully!', 'success');
        loadMyRequests();
    } catch (error) {
        showToast(error.message || 'Request failed.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '📋 Submit Organ Request';
    }
}

async function loadMyRequests() {
    try {
        const data = await apiFetch('/patients/organ-requests/my-requests');
        const container = document.getElementById('requests-list');

        if (data.requests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📋</div>
                    <h3>No organ requests yet</h3>
                    <p>Click the button above to submit your organ request</p>
                </div>`;
            return;
        }

        container.innerHTML = data.requests.map(req => `
            <div class="card" style="margin-bottom: 1rem;">
                <div class="flex-between">
                    <div>
                        <strong>${req.organ_type}</strong> — Blood Group: ${req.blood_group}
                        <div style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.25rem;">
                            Requested: ${new Date(req.requested_at).toLocaleDateString()}
                        </div>
                    </div>
                    <span class="badge badge-${req.status === 'matched' ? 'success' : req.status === 'open' ? 'warning' : 'info'}">${req.status}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Load requests error:', error);
    }
}
