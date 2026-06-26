/**************************************************************************
 * Copyright © 2026 Bangladeshi Software Ltd. All rights reserved.
 * Distributed under the license terms specified in this repository.
 *
 * ORIGINAL AUTHOR: Muhammad Nasim (Developer)
 **************************************************************************/

import axios from 'axios';

const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_UR || 'https://your-switch-server.com/api/v1',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

//  AUTH
export const login = (u, p) =>
  api.post('/auth/login', { username: u, password: p });
export const VerifyOTP = (u, o) =>
  api.post('/auth/verify-otp', { username: u, otp: o });

export const getDFSPToken = (d) => api.post('/auth/login-dfsp', d);

export const getUsers = () => api.get('/auth/users');
export const createUser = (d) => api.post('/auth/users', d);
export const updateUser = (id, d) => api.put(`/auth/users/${id}`, d);

//  DASHBOARD
export const getDashboardSummary = (p) =>
  api.get('/dashboard/summary', { params: p });

// TRANSFERS
export const getTransfers = (p) => api.get('/transfers', { params: p });
export const getTransferById = (id) => api.get(`/transfers/${id}`);
export const getTransferStats = (p) =>
  api.get('/transfers/stats', { params: p });

// RECONCILIATION
export const getReconciliation = (p) =>
  api.get('/reconciliation', { params: p });
export const runReconciliation = (d) => api.post('/reconciliation/run', d);
export const getReconciliationReport = (p) =>
  api.get('/reconciliation/report', { params: p });

// DFSP
export const getDfsps = () => api.get('/dfsps');
export const getDfspById = (id) => api.get(`/dfsps/${id}`);
export const createDfsp = (d) => api.post('/dfsps', d);
export const updateDfsp = (id, d) => api.put(`/dfsps/${id}`, d);

// PISP
export const getPisps = () => api.get('/pisps');
export const getPispById = (id) => api.get(`/pisps/${id}`);
export const createPisp = (d) => api.post('/pisps', d);
export const updatePisp = (id, d) => api.put(`/pisps/${id}`, d);
export const deletePisp = (id) => api.delete(`/pisps/${id}`);
export const getPispEndpoints = (id) => api.get(`/pisps/${id}/endpoints`);
export const registerPispEndpoints = (id, d) =>
  api.post(`/pisps/${id}/endpoints`, d);

//  SETTLEMENT
export const getSettlementWindows = () => api.get('/settlement/windows');
export const getSettlementPositions = (p) =>
  api.get('/settlement/positions', { params: p });
export const openSettlementWindow = () => api.post('/settlement/windows');
// export const closeSettlementWindow = (id) => {
//   // api.put(`/settlement/windows/${id}/close`);
//   api.post(`/settlement/complete`, { window_id: id });
// };
export const closeSettlementWindow = (id) => {
  return api.post(
    `/settlement/complete`,
    { window_id: id },
    {
      timeout: 120000, // 2 minutes - settlement takes 6 steps + delays
    },
  );
};
export const finalizeSettlement = (id, d) =>
  api.post(`/settlement/${id}/finalize`, d);

// DFSP POSITIONS (Liquidity)
export const getDfspPositions = (p) => api.get('/positions', { params: p });
export const getPositionChanges = (p) =>
  api.get('/positions/changes', { params: p });
export const getDfspLimits = (p) => api.get('/positions/limits', { params: p });
export const setDfspLimit = (d) => api.post('/positions/limits', d);
export const updateDfspLimit = (d) => api.put('/positions/update-limits', d);

// NOTIFICATIONS
export const getNotifications = (p) => api.get('/notifications', { params: p });

// HUB
export const getHubAccounts = () => api.get('/hub/accounts');
export const createHubAccount = (d) => api.post('/hub/accounts', d);
export const getSettlementModels = () => api.get('/hub/settlement-models');
export const createSettlementModel = (d) =>
  api.post('/hub/settlement-models', d);
export const getOracles = () => api.get('/hub/oracles');
export const createOracle = (d) => api.post('/hub/oracles', d);
export const deleteOracle = (id) => api.delete(`/hub/oracles/${id}`);

export default api;
