/**
 * Mappe les champs d'un film provenant du movies-service (Spring Boot)
 * vers le format attendu par le frontend.
 *
 * Spring Boot Film entity: { id, nom, genre, duration, description, imageData }
 * Frontend attend:         { id, name, genre, duration, description, posterUrl }
 */
function mapMovieFields(film) {
    if (!film) return null;

    return {
        id: film.id,
        name: film.nom || film.name || 'Sans titre',
        genre: film.genre || '',
        duration: film.duration || null,
        description: film.description || '',
        posterUrl: film.imageData || film.posterUrl || null,
    };
}

/**
 * Mappe un tableau de films
 */
function mapMovieList(films) {
    if (!Array.isArray(films)) return [];
    return films.map(mapMovieFields).filter(Boolean);
}

module.exports = { mapMovieFields, mapMovieList };
