const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },
    userId: {
        type: Number,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    numberOfSeats: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    userType: {
        type: String,
        default: 'regular'
    },
    discountApplied: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'confirmed'
    },
    reservationCode: {
        type: String,
        unique: true
    }
}, {
    timestamps: true
});

// Generate unique reservation code before saving
reservationSchema.pre('save', function (next) {
    if (!this.reservationCode) {
        this.reservationCode = 'RES-' + Date.now().toString(36).toUpperCase() +
            Math.random().toString(36).substring(2, 6).toUpperCase();
    }
    next();
});

// Index for efficient queries
reservationSchema.index({ userId: 1 });
reservationSchema.index({ sessionId: 1 });
reservationSchema.index({ reservationCode: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
