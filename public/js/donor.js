// =====================================================
// Donor Dashboard JS
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    const user = requireAuth(['donor']);
    if (!user) return;
    loadDonorProfile();
});

async function loadDonorProfile() {
    try {
        const data = await apiFetch('/donors/my-profile');
        displayDonorProfile(data.donor);
    } catch (error) {
        if (error.status === 404) {
            document.getElementById('profile-section').classList.add('hidden');
            document.getElementById('registration-section').classList.remove('hidden');
        }
    }
}

function displayDonorProfile(donor) {
    document.getElementById('registration-section').classList.add('hidden');
    document.getElementById('profile-section').classList.remove('hidden');

    document.getElementById('donor-name').textContent = donor.name;
    document.getElementById('donor-email').textContent = donor.email;
    document.getElementById('donor-blood').textContent = donor.blood_group;
    document.getElementById('donor-organ').textContent = donor.organ;
    document.getElementById('donor-age').textContent = donor.age;
    document.getElementById('donor-gender').textContent = donor.gender;
    document.getElementById('donor-phone').textContent = donor.phone;
    document.getElementById('donor-city').textContent = donor.city;

    const statusEl = document.getElementById('donor-status');
    statusEl.textContent = donor.status;
    statusEl.className = `badge badge-${donor.status === 'approved' ? 'success' : donor.status === 'pending' ? 'warning' : 'danger'}`;
}

async function handleDonorRegistration(event) {
    event.preventDefault();
    const submitBtn = event.target.querySelector('button[type="submit"]');

    const formData = {
        blood_group: document.getElementById('reg-blood').value,
        organ: document.getElementById('reg-organ').value,
        age: parseInt(document.getElementById('reg-age').value),
        gender: document.getElementById('reg-gender').value,
        phone: document.getElementById('reg-phone').value,
        city: document.getElementById('reg-city').value,
        medical_history: document.getElementById('reg-history').value
    };

    if (!formData.blood_group || !formData.organ || !formData.age || !formData.gender || !formData.phone || !formData.city) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        await apiFetch('/donors', { method: 'POST', body: formData });
        showToast('Donor registration successful!', 'success');
        setTimeout(() => loadDonorProfile(), 1000);
    } catch (error) {
        showToast(error.message || 'Registration failed.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register as Donor';
    }
}
