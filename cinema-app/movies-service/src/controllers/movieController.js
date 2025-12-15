const Movie = require('../models/Movie');
const { validationResult } = require('express-validator');

// Get all movies
exports.getAllMovies = async (req, res) => {
    try {
        const { genre, year, active } = req.query;
        const filter = {};

        if (genre) filter.genre = new RegExp(genre, 'i');
        if (year) filter.year = parseInt(year);
        if (active !== undefined) filter.isActive = active === 'true';

        const movies = await Movie.find(filter).sort({ createdAt: -1 });
        res.json(movies);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching movies', details: error.message });
    }
};

// Get movie by ID
exports.getMovieById = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        res.json(movie);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching movie', details: error.message });
    }
};

// Create new movie
exports.createMovie = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const movie = new Movie(req.body);
        await movie.save();
        res.status(201).json(movie);
    } catch (error) {
        res.status(500).json({ error: 'Error creating movie', details: error.message });
    }
};

// Update movie
exports.updateMovie = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const movie = await Movie.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        res.json(movie);
    } catch (error) {
        res.status(500).json({ error: 'Error updating movie', details: error.message });
    }
};

// Delete movie
exports.deleteMovie = async (req, res) => {
    try {
        const movie = await Movie.findByIdAndDelete(req.params.id);
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        res.json({ message: 'Movie deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting movie', details: error.message });
    }
};
