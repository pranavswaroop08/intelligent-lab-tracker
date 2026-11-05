/**
 * API Service Client for Intelligent Laboratory Platform
 * Automatically interfaces with Flask backend on /api
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // System Health
  getHealth: () => request('/health'),

  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getUsers: () => request('/auth/users'),
  getRoles: () => request('/auth/roles'),

  // Analytics & Dashboard
  getDashboard: () => request('/analytics/dashboard'),
  getAuditLogs: (params = '') => request(`/analytics/audit-logs${params ? '?' + params : ''}`),
  getViewData: (viewName) => request(`/analytics/views/${viewName}`),
  getSchemaMetadata: () => request('/analytics/schema-metadata'),

  // Chemicals & Batches
  getChemicals: (params = '') => request(`/chemicals${params ? '?' + params : ''}`),
  getChemical: (id) => request(`/chemicals/${id}`),
  createChemical: (data) => request('/chemicals', { method: 'POST', body: JSON.stringify(data) }),
  getBatches: (params = '') => request(`/chemicals/batches${params ? '?' + params : ''}`),
  createBatch: (data) => request('/chemicals/batches', { method: 'POST', body: JSON.stringify(data) }),
  getBatchQR: (id) => request(`/chemicals/batches/${id}/qr`),
  getHazards: () => request('/chemicals/hazards'),

  // Assets & Instrumentation
  getAssets: (params = '') => request(`/assets${params ? '?' + params : ''}`),
  getAsset: (id) => request(`/assets/${id}`),
  createAsset: (data) => request('/assets', { method: 'POST', body: JSON.stringify(data) }),
  borrowAsset: (id, data) => request(`/assets/${id}/borrow`, { method: 'POST', body: JSON.stringify(data) }),
  returnAsset: (id, data) => request(`/assets/${id}/return`, { method: 'POST', body: JSON.stringify(data) }),
  calibrateAsset: (id, data) => request(`/assets/${id}/calibrate`, { method: 'POST', body: JSON.stringify(data) }),
  getAssetQR: (id) => request(`/assets/${id}/qr`),

  // Storage Locations & Cabinets
  getLocations: (params = '') => request(`/locations${params ? '?' + params : ''}`),
  getLocationDetail: (id) => request(`/locations/${id}`),
  auditLocation: (id) => request(`/locations/${id}/safety-audit`),
  createLocation: (data) => request('/locations', { method: 'POST', body: JSON.stringify(data) }),

  // Safety & Compatibility Matrix
  checkPairCompatibility: (chemical_a_id, chemical_b_id) =>
    request('/compatibility/check-pair', {
      method: 'POST',
      body: JSON.stringify({ chemical_a_id, chemical_b_id })
    }),
  getIncompatibilityRules: () => request('/compatibility/rules'),
  getFacilityAudit: () => request('/compatibility/facility-audit'),

  // Dispensations & Waste
  getDispensations: (params = '') => request(`/dispensations${params ? '?' + params : ''}`),
  dispenseChemical: (data) => request('/dispensations', { method: 'POST', body: JSON.stringify(data) }),
  getWasteLogs: () => request('/dispensations/waste'),
  logWaste: (data) => request('/dispensations/waste', { method: 'POST', body: JSON.stringify(data) }),

  // Maintenance & Calibration
  getMaintenanceSchedule: (days = 60) => request(`/maintenance/schedule?days=${days}`),
  getCalibrations: () => request('/maintenance/calibrations'),

  // AI Laboratory Safety Advisor
  askSafetyAdvisor: (prompt, context = {}) =>
    request('/ai/safety-advisor', {
      method: 'POST',
      body: JSON.stringify({ prompt, ...context })
    })
};
