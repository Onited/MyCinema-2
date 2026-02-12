const API_BASE = '/api/movies';

/**
 * Récupérer tous les films
 */
export async function getAllMovies() {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Erreur lors du chargement des films');
    const data = await res.json();
    return data.map(mapMovie);
}

/**
 * Récupérer un film par ID
 */
export async function getMovieById(id) {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error('Film introuvable');
    return mapMovie(await res.json());
}

/**
 * Mappe les champs du backend vers le frontend
 */
function mapMovie(raw) {
    return {
        id: raw.id,
        name: raw.nom || raw.name,
        genre: raw.genre,
        duration: raw.duration,
        durationMinutes: raw.duration ? Math.round(raw.duration / 60_000_000_000) : null,
        description: raw.description,
        posterUrl: raw.imageData || raw.posterUrl || null,
    };
}
