const axios = require('axios');
const { mapMovieFields, mapMovieList } = require('../utils/movieMapper');

const MOVIES_SERVICE_URL = process.env.MOVIES_SERVICE_URL || 'http://localhost:8090';

/**
 * GET /api/movies
 * Proxy la liste de tous les films depuis movies-service avec mapping des champs
 */
exports.getMovies = async (req, res) => {
    try {
        const response = await axios.get(`${MOVIES_SERVICE_URL}/films`, { timeout: 5000 });
        const movies = mapMovieList(response.data);
        res.json(movies);
    } catch (error) {
        console.error('Erreur lors de la récupération des films depuis movies-service:', error.message);

        if (error.response) {
            // movies-service a répondu avec une erreur
            return res.status(error.response.status).json({
                error: 'Impossible de charger les films',
                details: error.response.data
            });
        }

        // movies-service injoignable (timeout, connexion refusée, etc.)
        return res.status(503).json({
            error: 'Impossible de charger les films',
            details: 'Le service de films est temporairement indisponible'
        });
    }
};

/**
 * GET /api/movies/:id
 * Proxy un film par son ID depuis movies-service avec mapping des champs
 */
exports.getMovieById = async (req, res) => {
    try {
        const response = await axios.get(`${MOVIES_SERVICE_URL}/films/${req.params.id}`, { timeout: 5000 });
        const movie = mapMovieFields(response.data);
        if (!movie) {
            return res.status(404).json({ error: 'Film non trouvé' });
        }
        res.json(movie);
    } catch (error) {
        console.error(`Erreur lors de la récupération du film ${req.params.id}:`, error.message);

        if (error.response?.status === 404) {
            return res.status(404).json({ error: 'Film non trouvé' });
        }

        if (error.response) {
            return res.status(error.response.status).json({
                error: 'Impossible de charger les films',
                details: error.response.data
            });
        }

        return res.status(503).json({
            error: 'Impossible de charger les films',
            details: 'Le service de films est temporairement indisponible'
        });
    }
};
