export const API_BASE_URL = "http://127.0.0.1:8000";

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

/**
 * Custom fetch wrapper to handle errors consistently
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Fetch Error [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  login: (credentials) => apiFetch("/auth/login", { method: 'POST', body: JSON.stringify(credentials) }),
  adminLogin: (credentials) => apiFetch("/auth/admin/login", { method: 'POST', body: JSON.stringify(credentials) }),
  
  getHealth: () => apiFetch("/health"),
  
  getCases: (params) => {
    // Filter out undefined/null/empty strings from params
    const activeParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v != null && v !== '')
    );
    return apiFetch(`/cases?${new URLSearchParams(activeParams)}`);
  },
  getCaseById: (id) => apiFetch(`/cases/${id}`),
  
  createCase: (data) => apiFetch('/cases', { method: 'POST', body: JSON.stringify(data) }),
  
  searchCases: (query) => apiFetch(`/cases/search?q=${encodeURIComponent(query)}`),
  
  uploadEvidence: async (formData) => {
    const headers = {};
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    // Intentionally omitting Content-Type so browser sets boundary for multipart/form-data
    const response = await fetch(`${API_BASE_URL}/evidence`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  },
  verifyEvidence: (id) => apiFetch(`/evidence/${id}/verify`, { method: 'PATCH' }),
  getPendingEvidence: () => apiFetch(`/evidence/pending`),
  
  getStationTeam: () => apiFetch('/station/team'),
  getStationRecords: (query = '') => apiFetch(query ? `/station/records?q=${encodeURIComponent(query)}` : '/station/records'),

  getDashboardStats: (days = 180) => apiFetch(`/dashboard/stats?days=${days}`),
  getDashboardTopOffenders: () => apiFetch("/dashboard/top-offenders"),
  getDashboardDrilldown: () => apiFetch("/dashboard/drilldown"),
  
  getMapCases: () => apiFetch("/cases/map"),
  
  getAnalyticsHotspots: () => apiFetch("/analytics/hotspots"),
  getRangeDistricts: () => apiFetch('/analytics/range-districts'),
  getDistrictComparison: (districtIds) => apiFetch(`/analytics/district-comparison?district_ids=${districtIds.join(',')}`),
  getRegionalHeatmap: (zoneId) => apiFetch(`/analytics/regional-heatmap?zone_id=${zoneId}`),
  getDistrictRiskRatings: (zoneId) => apiFetch(`/analytics/district-risk-rating?zone_id=${zoneId}`),

  getDepartments: () => apiFetch('/department/all'),
  getDepartmentKPIs: (departmentId) => apiFetch(`/analytics/department-kpis?department_id=${departmentId}`),
  getDepartmentFlags: (departmentId) => apiFetch(departmentId ? `/department/flags?department_id=${departmentId}` : '/department/flags'),
  flagCaseToDepartment: (caseId, toDepartmentId, note) => apiFetch(`/department/cases/${caseId}/flag`, {
    method: 'POST',
    body: JSON.stringify({ ToDepartmentID: toDepartmentId, Note: note })
  }),
  updateDepartmentFlagStatus: (flagId, status) => apiFetch(`/department/flags/${flagId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ Status: status })
  }),

  // DGP & Command Center
  queryCopilot: (query) => apiFetch('/copilot/query', {
    method: 'POST',
    body: JSON.stringify({ query })
  }),
  getStatewideAnomalies: () => apiFetch('/analytics/statewide-anomalies'),
  getNetworkGraph: (caseId = '') => apiFetch(caseId ? `/analytics/network-graph?case_id=${caseId}` : '/analytics/network-graph'),
  getDecisionTimeline: () => apiFetch('/analytics/decision-timeline'),

  
  getSimilarCases: (id) => apiFetch(`/cases/${id}/similar`),
  
  // Alerts
  getAlerts: (status) => apiFetch(status ? `/alerts?status=${status}` : '/alerts'),
  getAlertById: (id) => apiFetch(`/alerts/${id}`),
  updateAlertStatus: (id, data) => apiFetch(`/alerts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  refreshAlerts: () => apiFetch('/alerts/refresh', { method: 'POST' }),
  
  // Future endpoints to be implemented:
  getSummary: (id) => apiFetch(`/cases/${id}/summary`),
  regenerateSummary: (id) => apiFetch(`/cases/${id}/summary/regenerate`, { method: "POST" }),

  // Inspector
  getStationPendingApprovalCases: () => apiFetch('/cases/station/pending-approval'),
  approveCase: (id) => apiFetch(`/cases/${id}/approve`, { method: 'POST' }),
  broadcastUrgentAlert: (id, reason) => apiFetch(`/cases/${id}/broadcast-alert`, { method: 'POST', body: JSON.stringify({ reason }) }),


  // Profile
  getProfile: () => apiFetch('/profile/me'),
  updateProfile: (data) => apiFetch('/profile/me', { method: 'PATCH', body: JSON.stringify(data) }),

  // District Command
  getDistrictInspectors: () => apiFetch('/district/inspectors'),
  orderInvestigation: (id, payload) => apiFetch(`/district/cases/${id}/order-investigation`, { method: 'POST', body: JSON.stringify(payload) }),

  uploadPhoto: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const headers = {};
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    const response = await fetch(`${API_BASE_URL}/profile/me/photo`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  },
  changePassword: (data) => apiFetch('/profile/me/password', { method: 'POST', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: () => apiFetch('/notifications'),
  getUnreadCount: () => apiFetch('/notifications/unread-count'),
  markAsRead: (id) => apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () => apiFetch('/notifications/read-all', { method: 'PATCH' }),

  // Admin
  getOfficers: () => apiFetch('/admin/officers'),
  createOfficer: (data) => apiFetch('/admin/officers', { method: 'POST', body: JSON.stringify(data) }),
  deactivateOfficer: (id) => apiFetch(`/admin/officers/${id}/deactivate`, { method: 'PATCH' }),

  // Demo Admin
  resetDemo: () => apiFetch('/demo/reset', { method: 'POST' }),
};
