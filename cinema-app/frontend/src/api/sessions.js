const SESSIONS_BASE = '/api/sessions';
const RESERVATIONS_BASE = '/api/reservations';

/* ─── Sessions ─── */

export async function getAllSessions(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${SESSIONS_BASE}?${query}` : SESSIONS_BASE;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erreur lors du chargement des séances');
    return res.json();
}

export async function getSessionsByMovie(movieId) {
    const res = await fetch(`${SESSIONS_BASE}/movie/${movieId}`);
    if (!res.ok) throw new Error('Erreur lors du chargement des séances');
    return res.json();
}

export async function getSessionById(id) {
    const res = await fetch(`${SESSIONS_BASE}/${id}`);
    if (!res.ok) throw new Error('Séance introuvable');
    return res.json();
}

export async function createSession(data) {
    const res = await fetch(SESSIONS_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erreur lors de la création');
    return result;
}

/* ─── Reservations ─── */

export async function createReservation(data, token) {
    const res = await fetch(RESERVATIONS_BASE, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erreur lors de la réservation');
    return result;
}

export async function getReservationsByUser(userId) {
    const res = await fetch(`${RESERVATIONS_BASE}/user/${userId}`);
    if (!res.ok) throw new Error('Erreur lors du chargement des réservations');
    return res.json();
}

export async function getReservationByCode(code) {
    const res = await fetch(`${RESERVATIONS_BASE}/code/${code}`);
    if (!res.ok) throw new Error('Réservation introuvable');
    return res.json();
}

export async function cancelReservation(id) {
    const res = await fetch(`${RESERVATIONS_BASE}/${id}/cancel`, {
        method: 'PATCH',
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erreur lors de l\'annulation');
    return result;
}
