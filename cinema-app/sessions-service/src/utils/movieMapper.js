/**
 * Maps fields from a movie from movies-service (Spring Boot)
 * to the format expected by the frontend.
 *
 * Spring Boot Film entity: { id, nom, genre, duration, description, imageData }
 * Frontend expects:        { id, name, genre, duration, description, posterUrl }
 */
function mapMovieFields(film) {
    if (!film) return null;

    return {
        id: film.id,
        name: film.nom || film.name || 'Untitled',
        genre: film.genre || '',
        duration: film.duration || null,
        description: film.description || '',
        posterUrl: film.imageData || film.posterUrl || null,
    };
}

/**
 * Maps an array of movies
 */
function mapMovieList(films) {
    if (!Array.isArray(films)) return [];
    return films.map(mapMovieFields).filter(Boolean);
}

module.exports = { mapMovieFields, mapMovieList };
