const Session = require('../models/Session');
const { validationResult } = require('express-validator');
const axios = require('axios');
const { mapMovieFields } = require('../utils/movieMapper');

const MOVIES_SERVICE_URL = process.env.MOVIES_SERVICE_URL || 'http://localhost:8090';

// Get all sessions
exports.getAllSessions = async (req, res) => {
    try {
        const { date, room, active, upcoming } = req.query;
        const filter = {};

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            filter.date = { $gte: startDate, $lte: endDate };
        }

        if (upcoming === 'true') {
            filter.date = { $gte: new Date() };
        }

        if (room) filter.roomNumber = room;
        if (active !== undefined) filter.isActive = active === 'true';

        const sessions = await Session.find(filter).sort({ date: 1, startTime: 1 });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching sessions', details: error.message });
    }
};

// Get sessions by movie
exports.getSessionsByMovie = async (req, res) => {
    try {
        const sessions = await Session.find({
            movieId: req.params.movieId,
            isActive: true,
            date: { $gte: new Date() }
        }).sort({ date: 1, startTime: 1 });

        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching sessions', details: error.message });
    }
};

// Get session by ID
exports.getSessionById = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(session);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching session', details: error.message });
    }
};

// Create new session
exports.createSession = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { movieId } = req.body;

        // Valider que le film existe dans movies-service et récupérer son nom
        let movieName = req.body.movieName;
        try {
            const movieResponse = await axios.get(`${MOVIES_SERVICE_URL}/films/${movieId}`, { timeout: 5000 });
            const movie = mapMovieFields(movieResponse.data);
            if (movie) {
                movieName = movie.name;
            }
        } catch (movieError) {
            if (movieError.response?.status === 404) {
                return res.status(404).json({ error: 'Film non trouvé' });
            }
            // movies-service injoignable
            return res.status(503).json({
                error: 'Impossible de charger les films',
                details: 'Le service de films est temporairement indisponible'
            });
        }

        const sessionData = {
            ...req.body,
            movieName,
            availableSeats: req.body.totalSeats,
            basePrice: req.body.basePrice || parseFloat(process.env.BASE_TICKET_PRICE) || 10.00
        };

        const session = new Session(sessionData);
        await session.save();
        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ error: 'Error creating session', details: error.message });
    }
};

// Update session
exports.updateSession = async (req, res) => {
    try {
        const session = await Session.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(session);
    } catch (error) {
        res.status(500).json({ error: 'Error updating session', details: error.message });
    }
};

// Delete session
exports.deleteSession = async (req, res) => {
    try {
        const session = await Session.findByIdAndDelete(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json({ message: 'Session deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting session', details: error.message });
    }
};
