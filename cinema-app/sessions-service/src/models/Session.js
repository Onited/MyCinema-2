const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    movieId: {
        type: String,
        required: true
    },
    movieName: {
        type: String,
        required: true
    },
    roomNumber: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,  // Format: "HH:MM"
        required: true
    },
    endTime: {
        type: String,  // Format: "HH:MM"
        required: true
    },
    totalSeats: {
        type: Number,
        required: true,
        min: 1
    },
    availableSeats: {
        type: Number,
        required: true,
        min: 0
    },
    basePrice: {
        type: Number,
        required: true,
        default: 10.00
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
sessionSchema.index({ movieId: 1, date: 1 });
sessionSchema.index({ date: 1, startTime: 1 });

module.exports = mongoose.model('Session', sessionSchema);
