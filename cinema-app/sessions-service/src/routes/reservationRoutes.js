const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { body, validationResult } = require('express-validator');

// Validation middleware for creating a reservation
const validateReservation = [
    body('sessionId').notEmpty().withMessage('Session ID is required'),
    body('numberOfSeats').isInt({ min: 1, max: 10 }).withMessage('Number of seats must be between 1 and 10'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

// GET all reservations (admin)
router.get('/', reservationController.getAllReservations);

// GET reservations by user
router.get('/user/:userId', reservationController.getReservationsByUser);

// GET reservation by code
router.get('/code/:code', reservationController.getReservationByCode);

// GET reservation by ID
router.get('/:id', reservationController.getReservationById);

// POST create new reservation
router.post('/', validateReservation, reservationController.createReservation);

// PUT cancel reservation
router.put('/:id/cancel', reservationController.cancelReservation);

// DELETE reservation (admin)
router.delete('/:id', reservationController.deleteReservation);

module.exports = router;
