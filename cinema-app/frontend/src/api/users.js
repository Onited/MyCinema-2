const API_BASE = '/api/users';

/**
 * Inscription — envoie du JSON
 */
export async function register({ email, password, fullName, userType }) {
    const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            password,
            full_name: fullName,
            user_type: userType || 'standard',
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Erreur lors de l\'inscription');
    return data;
}

/**
 * Connexion — le user-service attend du form-data (OAuth2)
 */
export async function login(email, password) {
    const form = new URLSearchParams();
    form.append('username', email);
    form.append('password', password);

    const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Email ou mot de passe incorrect');
    return data; // { access_token, token_type }
}

/**
 * Profil utilisateur courant
 */
export async function getMe(token) {
    const res = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Session expirée');
    return res.json();
}

/**
 * Mise à jour du profil
 */
export async function updateProfile(token, updates) {
    const res = await fetch(`${API_BASE}/me`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Erreur lors de la mise à jour');
    return data;
}
