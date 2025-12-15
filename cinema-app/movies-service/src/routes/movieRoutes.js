const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const { body } = require('express-validator');

// Validation middleware
const movieValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('genre').trim().notEmpty().withMessage('Genre is required'),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
    body('year').isInt({ min: 1888, max: new Date().getFullYear() + 5 }).withMessage('Invalid year'),
    body('director').trim().notEmpty().withMessage('Director is required')
];

// GET all movies
router.get('/', movieController.getAllMovies);

// GET movie by ID
router.get('/:id', movieController.getMovieById);

// POST create new movie
router.post('/', movieValidation, movieController.createMovie);

// PUT update movie
router.put('/:id', movieValidation, movieController.updateMovie);

// DELETE movie
router.delete('/:id', movieController.deleteMovie);

module.exports = router;
