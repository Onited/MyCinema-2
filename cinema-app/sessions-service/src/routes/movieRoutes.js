const express = require('express');
const router = express.Router();
const movieProxyController = require('../controllers/movieProxyController');

// GET all movies (proxy depuis movies-service)
router.get('/', movieProxyController.getMovies);

// GET movie by ID (proxy depuis movies-service)
router.get('/:id', movieProxyController.getMovieById);

module.exports = router;
