require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Service URLs
const MOVIES_SERVICE_URL = process.env.MOVIES_SERVICE_URL || 'http://localhost:3001';
const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://localhost:3002';
const SESSIONS_SERVICE_URL = process.env.SESSIONS_SERVICE_URL || 'http://localhost:3003';

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true
}));

// Root route - API info
app.get('/', (req, res) => {
    res.json({
        name: 'CinéBook API Gateway',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            movies: '/api/movies',
            auth: '/api/auth',
            users: '/api/users',
            sessions: '/api/sessions',
            reservations: '/api/reservations'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'api-gateway',
        routes: {
            movies: MOVIES_SERVICE_URL,
            users: USERS_SERVICE_URL,
            sessions: SESSIONS_SERVICE_URL
        }
    });
});

// Service health aggregation
app.get('/health/all', async (req, res) => {
    const axios = require('http-proxy-middleware');
    const services = [
        { name: 'movies', url: `${MOVIES_SERVICE_URL}/health` },
        { name: 'users', url: `${USERS_SERVICE_URL}/health` },
        { name: 'sessions', url: `${SESSIONS_SERVICE_URL}/health` }
    ];

    const results = {};
    for (const service of services) {
        try {
            const response = await fetch(service.url);
            results[service.name] = response.ok ? 'up' : 'down';
        } catch (error) {
            results[service.name] = 'down';
        }
    }

    res.json({ gateway: 'up', services: results });
});

// Proxy configuration with error handling for graceful degradation
const createProxy = (target, pathRewrite) => {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite,
        autoRewrite: true,
        followRedirects: true,
        onError: (err, req, res) => {
            console.error(`Proxy error: ${err.message}`);
            res.status(503).json({
                error: 'Service temporarily unavailable',
                service: target
            });
        }
    });
};

// Movies Service routes
app.use('/api/movies', createProxy(MOVIES_SERVICE_URL, {
    '^/api/movies': '/api/movies'
}));

// Users Service routes
app.use('/api/users', createProxy(USERS_SERVICE_URL, {
    '^/api/users': '/api/users'
}));

app.use('/api/auth', createProxy(USERS_SERVICE_URL, {
    '^/api/auth': '/api/auth'
}));

// Sessions Service routes
app.use('/api/sessions', createProxy(SESSIONS_SERVICE_URL, {
    '^/api/sessions': '/api/sessions'
}));

app.use('/api/reservations', createProxy(SESSIONS_SERVICE_URL, {
    '^/api/reservations': '/api/reservations'
}));

// Fallback for unknown routes
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log('Service routes:');
    console.log(`  Movies:   ${MOVIES_SERVICE_URL}`);
    console.log(`  Users:    ${USERS_SERVICE_URL}`);
    console.log(`  Sessions: ${SESSIONS_SERVICE_URL}`);
});

module.exports = app;
