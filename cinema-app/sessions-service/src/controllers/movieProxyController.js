const axios = require('axios');
const { mapMovieFields, mapMovieList } = require('../utils/movieMapper');

const MOVIES_SERVICE_URL = process.env.MOVIES_SERVICE_URL || 'http://localhost:8090';
const AXIOS_TIMEOUT = 5000;

const ERROR_MESSAGES = {
    MOVIES_LOAD_ERROR: 'Unable to load movies',
    MOVIE_NOT_FOUND: 'Movie not found',
    SERVICE_UNAVAILABLE: 'Movie service is temporarily unavailable'
};

// Handle errors from movies-service in a consistent way
const handleMovieServiceError = (res, error, context = '') => {
    console.error(`Error ${context}:`, error.message);

    if (error.response?.status === 404) {
        return res.status(404).json({ error: ERROR_MESSAGES.MOVIE_NOT_FOUND });
    }

    if (error.response) {
        return res.status(error.response.status).json({
            error: ERROR_MESSAGES.MOVIES_LOAD_ERROR,
            details: error.response.data
        });
    }

    return res.status(503).json({
        error: ERROR_MESSAGES.MOVIES_LOAD_ERROR,
        details: ERROR_MESSAGES.SERVICE_UNAVAILABLE
    });
};

/**
 * GET /api/movies
 * Proxies the list of all movies from movies-service with field mapping
 */
exports.getMovies = async (req, res) => {
    try {
        const response = await axios.get(`${MOVIES_SERVICE_URL}/films`, { timeout: AXIOS_TIMEOUT });
        res.json(mapMovieList(response.data));
    } catch (error) {
        handleMovieServiceError(res, error, 'while fetching movies');
    }
};

/**
 * GET /api/movies/:id
 * Proxies a movie by ID from movies-service with field mapping
 */
exports.getMovieById = async (req, res) => {
    try {
        const response = await axios.get(`${MOVIES_SERVICE_URL}/films/${req.params.id}`, { timeout: AXIOS_TIMEOUT });
        const movie = mapMovieFields(response.data);
        if (!movie) {
            return res.status(404).json({ error: ERROR_MESSAGES.MOVIE_NOT_FOUND });
        }
        res.json(movie);
    } catch (error) {
        handleMovieServiceError(res, error, `while fetching movie ${req.params.id}`);
    }
};
