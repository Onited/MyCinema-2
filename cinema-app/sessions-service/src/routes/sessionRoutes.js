const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { body } = require('express-validator');

// Validation middleware
const sessionValidation = [
    body('movieId').notEmpty().withMessage('Movie ID is required'),
    body('movieName').optional().isString().withMessage('Movie name must be a string'),
    body('roomNumber').notEmpty().withMessage('Room number is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time required (HH:MM)'),
    body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time required (HH:MM)'),
    body('totalSeats').isInt({ min: 1 }).withMessage('Total seats must be at least 1')
];

// GET all sessions
router.get('/', sessionController.getAllSessions);

// GET sessions by movie
router.get('/movie/:movieId', sessionController.getSessionsByMovie);

// GET session by ID
router.get('/:id', sessionController.getSessionById);

// POST create new session
router.post('/', sessionValidation, sessionController.createSession);

// PUT update session
router.put('/:id', sessionController.updateSession);

// DELETE session
router.delete('/:id', sessionController.deleteSession);

module.exports = router;
