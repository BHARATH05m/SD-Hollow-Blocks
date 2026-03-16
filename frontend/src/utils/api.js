import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Products API
export const productsAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Users API
export const usersAPI = {
  register: (data) => api.post('/users/register', data),
  login: (data) => api.post('/users/login', data),
  getAll: () => api.get('/users'),
  getOwnerContact: () => api.get('/users/owner-contact'),
};

// Orders API
export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  approve: (id, deliveryTime) => api.put(`/orders/${id}/approve`, { deliveryTime }),
  reject: (id) => api.put(`/orders/${id}/reject`),
  dispatch: (id) => api.put(`/orders/${id}/dispatch`),
  delay: (id, data) => api.put(`/orders/${id}/delay`, data),
  deliver: (id) => api.put(`/orders/${id}/deliver`),
  markReady: (id) => api.put(`/orders/${id}/ready`),
  markCollected: (id) => api.put(`/orders/${id}/collected`),
  addPhone: (id, customerPhone) => api.put(`/orders/${id}/phone`, { customerPhone }),
  addMessage: (id, message, sender) => api.post(`/orders/${id}/message`, { message, sender }),
  getMessages: (id, userId, role) => api.get(`/orders/${id}/messages`, { params: { userId, role } }),
  reportDeliveryIssue: (id, reportType, reportMessage, reportedBy) =>
    api.post(`/orders/report/${id}`, { reportType, reportMessage, reportedBy }),
  respondToReport: (id, reportId, ownerResponse) =>
    api.put(`/orders/report/${id}/${reportId}/respond`, { ownerResponse }),
  resolveReport: (id, reportId) =>
    api.put(`/orders/report/${id}/${reportId}/resolve`),
};

// General Messages API
export const generalMessagesAPI = {
  getConversations: (userId, role) => api.get('/general-messages', { params: { userId, role } }),
  getUsers: () => api.get('/general-messages/users'),
  startConversation: (ownerId, customerId, initialMessage) =>
    api.post('/general-messages/start', { ownerId, customerId, initialMessage }),
  addMessage: (conversationId, message, sender, userId) =>
    api.post(`/general-messages/${conversationId}/message`, { message, sender, userId }),
  getMessages: (conversationId, userId) =>
    api.get(`/general-messages/${conversationId}/messages`, { params: { userId } }),
  archiveConversation: (conversationId, userId) =>
    api.put(`/general-messages/${conversationId}/archive`, { userId }),
};

// Upload API
export const uploadAPI = {
  single: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  multiple: (thumbnailFile, backviewFile) => {
    if (!thumbnailFile && !backviewFile) {
      return Promise.reject(new Error('At least one file must be provided'));
    }
    const formData = new FormData();
    if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
    if (backviewFile) formData.append('backview', backviewFile);
    return api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
