// =====================================================
// Matching Results JS
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    const user = requireAuth(['admin', 'hospital']);
    if (!user) return;
    loadMatches();
});

async function loadMatches() {
    try {
        const data = await apiFetch('/matches');
        const container = document.getElementById('matches-container');

        if (data.matches.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🔗</div>
                    <h3>No matches yet</h3>
                    <p>Run the matching algorithm from the admin dashboard or hospital panel to find donor-patient matches.</p>
                </div>`;
            return;
        }

        container.innerHTML = data.matches.map(m => `
            <div class="card" style="margin-bottom: 1.25rem;">
                <div class="flex-between mb-2">
                    <h3 style="font-size: 1rem;">Match #${m.id}</h3>
                    <span class="badge badge-${m.status === 'approved' ? 'success' : m.status === 'completed' ? 'info' : m.status === 'rejected' ? 'danger' : 'warning'}">${m.status}</span>
                </div>
                <div class="grid-2" style="gap: 1.5rem;">
                    <div>
                        <div style="color: var(--accent-primary); font-size: 0.8rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem;">🩸 Donor</div>
                        <div><strong>${m.donor_name}</strong></div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">
                            Blood: ${m.donor_blood_group} | Organ: ${m.donor_organ}<br>
                            City: ${m.donor_city}
                        </div>
                    </div>
                    <div>
                        <div style="color: var(--info); font-size: 0.8rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem;">🏥 Patient</div>
                        <div><strong>${m.patient_name}</strong></div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">
                            Blood: ${m.request_blood_group} | Organ: ${m.organ_type}<br>
                            Urgency: <span class="badge badge-${m.urgency === 'critical' ? 'danger' : m.urgency === 'high' ? 'warning' : 'info'}" style="font-size: 0.7rem;">${m.urgency}</span>
                        </div>
                    </div>
                </div>
                <div class="mt-2">
                    <div style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 0.3rem;">
                        Compatibility Score: ${m.compatibility_score}%
                    </div>
                    <div class="score-bar">
                        <div class="score-fill score-${m.compatibility_score}" style="width: ${m.compatibility_score}%;"></div>
                    </div>
                </div>
                ${m.hospital_name ? `<div class="mt-1" style="color: var(--text-muted); font-size: 0.85rem;">🏥 Hospital: ${m.hospital_name}</div>` : ''}
                ${m.status === 'pending' ? `
                    <div class="flex gap-1 mt-2">
                        <button onclick="updateMatchStatus(${m.id}, 'approved')" class="btn btn-sm btn-primary">✅ Approve</button>
                        <button onclick="updateMatchStatus(${m.id}, 'rejected')" class="btn btn-sm btn-danger">❌ Reject</button>
                    </div>
                ` : m.status === 'approved' ? `
                    <div class="mt-2">
                        <button onclick="updateMatchStatus(${m.id}, 'completed')" class="btn btn-sm btn-primary">✅ Mark Completed</button>
                    </div>
                ` : ''}
                <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.5rem;">
                    Matched: ${new Date(m.matched_at).toLocaleString()}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Load matches error:', error);
        showToast('Failed to load matches.', 'error');
    }
}

async function updateMatchStatus(matchId, status) {
    try {
        await apiFetch(`/matches/${matchId}/status`, {
            method: 'PUT',
            body: { status }
        });
        showToast(`Match ${status} successfully!`, 'success');
        loadMatches();
    } catch (error) {
        showToast(error.message || 'Update failed.', 'error');
    }
}
