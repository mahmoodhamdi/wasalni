import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Read from zustand persisted store
    const storedAuth = localStorage.getItem('wasalni-admin-auth');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        const token = parsed?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Ignore parse errors
      }
    }
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('wasalni-admin-auth');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/admin/login', { email, password }),

  getProfile: () =>
    api.get('/auth/profile'),

  logout: () => {
    localStorage.removeItem('wasalni-admin-auth');
    window.location.href = '/auth/login';
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: () =>
    api.get('/admin/stats'),

  getRecentTrips: () =>
    api.get('/admin/trips/recent'),

  getRecentDrivers: () =>
    api.get('/admin/drivers/recent'),
};

// Passengers API
export const passengersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get('/admin/passengers', { params }),

  getById: (id: string) =>
    api.get(`/admin/passengers/${id}`),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/passengers/${id}`, data),

  toggleActive: (id: string) =>
    api.put(`/admin/passengers/${id}/toggle-active`),
};

// Drivers API
export const driversApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get('/admin/drivers', { params }),

  getById: (id: string) =>
    api.get(`/admin/drivers/${id}`),

  approve: (id: string) =>
    api.put(`/admin/drivers/${id}/approve`),

  reject: (id: string, reason: string) =>
    api.put(`/admin/drivers/${id}/reject`, { reason }),

  suspend: (id: string, reason: string) =>
    api.put(`/admin/drivers/${id}/suspend`, { reason }),

  activate: (id: string) =>
    api.put(`/admin/drivers/${id}/activate`),

  getPending: () =>
    api.get('/admin/drivers/pending'),
};

// Trips API
export const tripsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; from?: string; to?: string }) =>
    api.get('/admin/trips', { params }),

  getById: (id: string) =>
    api.get(`/admin/trips/${id}`),

  getStats: (params?: { from?: string; to?: string }) =>
    api.get('/admin/trips/stats', { params }),

  getRecent: (limit?: number) =>
    api.get('/admin/trips/recent', { params: { limit } }),

  getActive: () =>
    api.get('/admin/trips', { params: { status: 'active' } }),
};

// Settings API
export const settingsApi = {
  getFareSettings: () =>
    api.get('/admin/settings/fares'),

  updateFareSettings: (data: Record<string, unknown>) =>
    api.put('/admin/settings/fares', data),

  getZones: () =>
    api.get('/admin/settings/zones'),

  updateZone: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/settings/zones/${id}`, data),
};

// Location API
export const locationApi = {
  getOnlineDrivers: () =>
    api.get('/location/drivers/online'),

  getDriverLocation: (driverId: string) =>
    api.get(`/location/drivers/${driverId}`),
};

// Finance API
export const financeApi = {
  getStats: () =>
    api.get('/admin/finance/stats'),

  getRevenueChart: (days?: number) =>
    api.get('/admin/finance/revenue-chart', { params: { days } }),
};

// Promos API
export const promosApi = {
  getAll: (params?: { page?: number; limit?: number; active?: boolean }) =>
    api.get('/promo', { params }),

  getById: (id: string) =>
    api.get(`/promo/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/promo', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/promo/${id}`, data),

  deactivate: (id: string) =>
    api.delete(`/promo/${id}`),

  getStats: (id: string) =>
    api.get(`/promo/${id}/stats`),
};

// Zones API
export const zonesApi = {
  getAll: () =>
    api.get('/admin/settings/zones'),

  create: (data: Record<string, unknown>) =>
    api.post('/admin/settings/zones', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/settings/zones/${id}`, data),

  delete: (id: string) =>
    api.delete(`/admin/settings/zones/${id}`),
};
