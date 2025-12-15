import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for auth
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Movies API
export const moviesApi = {
    getAll: (params) => api.get('/movies', { params }),
    getById: (id) => api.get(`/movies/${id}`),
    create: (data) => api.post('/movies', data),
    update: (id, data) => api.put(`/movies/${id}`, data),
    delete: (id) => api.delete(`/movies/${id}`),
};

// Auth API
export const authApi = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    me: () => api.get('/auth/me'),
    verify: () => api.get('/auth/verify'),
};

// Users API
export const usersApi = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    getPricing: (id) => api.get(`/users/${id}/pricing`),
};

// Sessions API
export const sessionsApi = {
    getAll: (params) => api.get('/sessions', { params }),
    getByMovie: (movieId) => api.get(`/sessions/movie/${movieId}`),
    getById: (id) => api.get(`/sessions/${id}`),
    create: (data) => api.post('/sessions', data),
    update: (id, data) => api.put(`/sessions/${id}`, data),
    delete: (id) => api.delete(`/sessions/${id}`),
};

// Reservations API
export const reservationsApi = {
    getAll: () => api.get('/reservations'),
    getByUser: (userId) => api.get(`/reservations/user/${userId}`),
    getByCode: (code) => api.get(`/reservations/code/${code}`),
    getById: (id) => api.get(`/reservations/${id}`),
    create: (data) => api.post('/reservations', data),
    cancel: (id) => api.put(`/reservations/${id}/cancel`),
    delete: (id) => api.delete(`/reservations/${id}`),
};

export default api;
