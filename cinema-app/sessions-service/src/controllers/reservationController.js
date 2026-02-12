const Reservation = require('../models/Reservation');
const Session = require('../models/Session');
const { validationResult } = require('express-validator');

// Pricing multipliers by user type
const PRICING_MULTIPLIERS = {
    regular: 1.0,
    student: 0.8,      // 20% discount
    under16: 0.7,      // 30% discount
    unemployed: 0.75   // 25% discount
};

// Get all reservations
exports.getAllReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find()
            .populate('sessionId')
            .sort({ createdAt: -1 });
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching reservations', details: error.message });
    }
};

// Get reservations by user
exports.getReservationsByUser = async (req, res) => {
    try {
        const reservations = await Reservation.find({ userId: req.params.userId })
            .sort({ createdAt: -1 });
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching reservations', details: error.message });
    }
};

// Get reservation by code
exports.getReservationByCode = async (req, res) => {
    try {
        const reservation = await Reservation.findOne({
            reservationCode: req.params.code.toUpperCase()
        });

        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        res.json(reservation);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching reservation', details: error.message });
    }
};

// Get reservation by ID
exports.getReservationById = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        res.json(reservation);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching reservation', details: error.message });
    }
};

// Create new reservation
exports.createReservation = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { sessionId, numberOfSeats, userId, userName, userEmail, userType } = req.body;

        // Get session
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Check seat availability
        if (session.availableSeats < numberOfSeats) {
            return res.status(400).json({
                error: 'Not enough seats available',
                availableSeats: session.availableSeats,
                requestedSeats: numberOfSeats
            });
        }

        // Calculate pricing with user type discount
        const type = userType || 'regular';
        const multiplier = PRICING_MULTIPLIERS[type] || 1.0;
        const unitPrice = session.basePrice * multiplier;
        const totalPrice = unitPrice * numberOfSeats;
        const discountApplied = (1 - multiplier) * 100;

        // Create reservation
        const reservation = new Reservation({
            sessionId,
            userId,
            userName,
            userEmail,
            numberOfSeats,
            unitPrice,
            totalPrice,
            userType: type,
            discountApplied
        });

        await reservation.save();

        // Update available seats
        session.availableSeats -= numberOfSeats;
        await session.save();

        res.status(201).json({
            reservation,
            message: 'Reservation created successfully',
            pricingDetails: {
                basePrice: session.basePrice,
                userType: type,
                discountPercentage: discountApplied,
                unitPrice,
                numberOfSeats,
                totalPrice
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error creating reservation', details: error.message });
    }
};

// Cancel reservation
exports.cancelReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        if (reservation.status === 'cancelled') {
            return res.status(400).json({ error: 'Reservation is already cancelled' });
        }

        // Restore seats to session
        const session = await Session.findById(reservation.sessionId);
        if (session) {
            session.availableSeats += reservation.numberOfSeats;
            await session.save();
        }

        reservation.status = 'cancelled';
        await reservation.save();

        res.json({
            message: 'Reservation cancelled successfully',
            reservation
        });
    } catch (error) {
        res.status(500).json({ error: 'Error cancelling reservation', details: error.message });
    }
};

// Delete reservation
exports.deleteReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        // Restore seats if not already cancelled
        if (reservation.status !== 'cancelled') {
            const session = await Session.findById(reservation.sessionId);
            if (session) {
                session.availableSeats += reservation.numberOfSeats;
                await session.save();
            }
        }

        await Reservation.findByIdAndDelete(req.params.id);
        res.json({ message: 'Reservation deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting reservation', details: error.message });
    }
};
