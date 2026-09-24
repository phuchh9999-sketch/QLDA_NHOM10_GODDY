/**
 * Module: Common Global State, Navigation & Utilities
 */
let currentUserRole = 'admin';
let currentClientId = 1;
let currentToken = localStorage.getItem('goddy_token') || null;
let currentUser = null;
try {
  const savedUser = localStorage.getItem('goddy_user');
  if (savedUser) currentUser = JSON.parse(savedUser);
} catch (e) {
  console.warn('Không thể đọc goddy_user từ localStorage', e);
}

let globalClients = [];
let revenueChartInstance = null;
let industryChartInstance = null;
