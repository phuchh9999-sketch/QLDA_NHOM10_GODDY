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

// Page mapping for standalone HTML pages vs SPA tabs
const PAGE_URL_MAP = {
  'dashboard': 'index.html',
  'clients': 'clients.html',
  'recruitment': 'recruitment.html',
  'invoices': 'invoices.html',
  'debt': 'debt.html',
  'audit': 'audit.html',
  'client-portal': 'client-portal.html'
};

const TAB_TITLES = {
  'dashboard': 'Dashboard Dữ Liệu Tuyển Dụng & Tài Chính',
  'clients': 'Quản Lý Khách Hàng Doanh Nghiệp (B2B)',
  'recruitment': 'Quản Lý Deal Tuyển Dụng & Thời Hạn Bảo Hành',
  'invoices': 'Quản Lý Hóa Đơn Dịch Vụ Tuyển Dụng',
  'debt': 'Báo Cáo Công Nợ & Phân Tích Tuổi Nợ (Aging Report)',
  'audit': 'Nhật Ký Thao Tác Hệ Thống (Audit Trail)'
};

/**
 * Điều hướng Tab (Hỗ trợ cả Single-Page Dashboard và Standalone HTML pages)
 */
function switchTab(tabKey) {
  if (currentUserRole === 'client') {
    switchUserRole('admin');
    return;
  }

  const targetSection = document.getElementById('section-' + tabKey);

  // Nếu trang hiện tại không chứa section này (đang ở trang standalone khác), chuyển hướng sang file HTML tương ứng
  if (!targetSection) {
    if (PAGE_URL_MAP[tabKey]) {
      window.location.href = PAGE_URL_MAP[tabKey];
      return;
    }
  }

    // Nếu đang ở trang chứa đầy đủ các section (index.html), ẩn/hiện theo phong cách SPA
  const sections = ['dashboard', 'clients', 'recruitment', 'invoices', 'debt', 'audit', 'client-portal'];
  sections.forEach(s => {
    const el = document.getElementById('section-' + s);
    if (el) el.style.display = (s === tabKey) ? 'block' : 'none';
  });

    // Cập nhật trạng thái active cho sidebar
  document.querySelectorAll('#sidebarMenuInternal .sidebar-item').forEach(item => item.classList.remove('active'));
  const activeItem = Array.from(document.querySelectorAll('#sidebarMenuInternal .sidebar-item')).find(el => el.getAttribute('onclick')?.includes(tabKey));
  if (activeItem) activeItem.classList.add('active');

  // Cập nhật tiêu đề trang
  const headerEl = document.getElementById('pageHeaderTitle');
  if (headerEl) {
    headerEl.textContent = TAB_TITLES[tabKey] || 'GODDY RECRUIT';
  }

    // Tải dữ liệu tương ứng của module
  if (tabKey === 'dashboard' && typeof loadDashboard === 'function') loadDashboard();
  if (tabKey === 'clients' && typeof loadClients === 'function') loadClients();
  if (tabKey === 'recruitment' && typeof loadPlacements === 'function') loadPlacements();
  if (tabKey === 'invoices' && typeof loadInvoices === 'function') loadInvoices();
  if (tabKey === 'debt' && typeof loadDebt === 'function') loadDebt();
  if (tabKey === 'audit' && typeof loadAudit === 'function') loadAudit();
}

function reloadCurrentTab() {
  if (currentUserRole === 'client') {
    if (typeof loadClientPortal === 'function') loadClientPortal(currentClientId);
  } else {
    const activeItem = document.querySelector('#sidebarMenuInternal .sidebar-item.active');
    if (activeItem) {
      activeItem.click();
    } else {
      window.location.reload();
    }
  }
}

function formatMoney(amount) {
  return (parseFloat(amount) || 0).toLocaleString('vi-VN') + ' đ';
}

function downloadCSV(csv, filename) {
  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
