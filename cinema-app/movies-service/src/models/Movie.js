const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    genre: {
        type: String,
        required: true,
        trim: true
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    director: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    posterUrl: {
        type: String,
        trim: true
    },
    rating: {
        type: Number,
        min: 0,
        max: 10,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Movie', movieSchema);
