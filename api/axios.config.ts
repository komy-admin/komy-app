import axios from 'axios';

const BASE_URL = 'http://your-api-url.com/api';

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteurs si nécessaire
axiosInstance.interceptors.request.use(
  (config) => {
    // Ajouter le token par exemple
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);