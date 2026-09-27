/**
 * GODDY ERP - Common Global State, Navigation & Utilities
 * FE-05: NGUYEN_HOANG_PHUOC
 *
 * IMPORTANT:
 * File này giữ lại logic frontend hiện có của nhóm
 * và bổ sung bộ tiện ích GoddyCommon dùng chung.
 */

"use strict";

/* =========================================================
   GLOBAL STATE
   ========================================================= */

let currentUserRole = "admin";
let currentClientId = 1;
let currentToken = localStorage.getItem("goddy_token") || null;
let currentUser = null;

try {
    const savedUser = localStorage.getItem("goddy_user");

    if (savedUser) {
        currentUser = JSON.parse(savedUser);

        if (currentUser && currentUser.role) {
            currentUserRole = currentUser.role;
        }

        if (currentUser && currentUser.clientId) {
            currentClientId = currentUser.clientId;
        }
    }
} catch (error) {
    console.warn(
        "Không thể đọc goddy_user từ localStorage",
        error
    );
}

let globalClients = [];
let revenueChartInstance = null;
let industryChartInstance = null;


/* =========================================================
   PAGE MAPPING
   ========================================================= */

const PAGE_URL_MAP = {
    dashboard: "index.html",
    clients: "clients.html",
    recruitment: "recruitment.html",
    invoices: "invoices.html",
    debt: "debt.html",
    audit: "audit.html",
    "client-portal": "client-portal.html"
};


/* =========================================================
   PAGE TITLES
   ========================================================= */

const TAB_TITLES = {
    dashboard: "Dashboard Dữ Liệu Tuyển Dụng & Tài Chính",
    clients: "Quản Lý Khách Hàng Doanh Nghiệp (B2B)",
    recruitment: "Quản Lý Deal Tuyển Dụng & Thời Hạn Bảo Hành",
    invoices: "Quản Lý Hóa Đơn Dịch Vụ Tuyển Dụng",
    debt: "Báo Cáo Công Nợ & Phân Tích Tuổi Nợ (Aging Report)",
    audit: "Nhật Ký Thao Tác Hệ Thống (Audit Trail)"
};


/* =========================================================
   NAVIGATION
   ========================================================= */

function switchTab(tabKey) {
    if (currentUserRole === "client") {
        switchUserRole("admin");
        return;
    }

    const targetSection = document.getElementById(
        "section-" + tabKey
    );

    /*
     * Nếu trang hiện tại không chứa section cần thiết,
     * chuyển sang HTML tương ứng.
     */
    if (!targetSection) {
        if (PAGE_URL_MAP[tabKey]) {
            window.location.href = PAGE_URL_MAP[tabKey];
        }

        return;
    }

    /*
     * SPA section switching.
     */
    const sections = [
        "dashboard",
        "clients",
        "recruitment",
        "invoices",
        "debt",
        "audit",
        "client-portal"
    ];

    sections.forEach(function (section) {
        const element = document.getElementById(
            "section-" + section
        );

        if (element) {
            element.style.display =
                section === tabKey
                    ? "block"
                    : "none";
        }
    });

    /*
     * Sidebar active state.
     */
    document
        .querySelectorAll(
            "#sidebarMenuInternal .sidebar-item"
        )
        .forEach(function (item) {
            item.classList.remove("active");
        });

    const activeItem = Array.from(
        document.querySelectorAll(
            "#sidebarMenuInternal .sidebar-item"
        )
    ).find(function (element) {
        const onclick =
            element.getAttribute("onclick") || "";

        return onclick.includes(tabKey);
    });

    if (activeItem) {
        activeItem.classList.add("active");
    }

    /*
     * Page title.
     */
    const headerElement =
        document.getElementById(
            "pageHeaderTitle"
        );

    if (headerElement) {
        headerElement.textContent =
            TAB_TITLES[tabKey] ||
            "GODDY RECRUIT";
    }

    /*
     * Load module data.
     */
    if (
        tabKey === "dashboard" &&
        typeof loadDashboard === "function"
    ) {
        loadDashboard();
    }

    if (
        tabKey === "clients" &&
        typeof loadClients === "function"
    ) {
        loadClients();
    }

    if (
        tabKey === "recruitment" &&
        typeof loadPlacements === "function"
    ) {
        loadPlacements();
    }

    if (
        tabKey === "invoices" &&
        typeof loadInvoices === "function"
    ) {
        loadInvoices();
    }

    if (
        tabKey === "debt" &&
        typeof loadDebt === "function"
    ) {
        loadDebt();
    }

    if (
        tabKey === "audit" &&
        typeof loadAudit === "function"
    ) {
        loadAudit();
    }
}


function reloadCurrentTab() {
    if (currentUserRole === "client") {
        if (
            typeof loadClientPortal === "function"
        ) {
            loadClientPortal(currentClientId);
        }

        return;
    }

    const activeItem = document.querySelector(
        "#sidebarMenuInternal .sidebar-item.active"
    );

    if (activeItem) {
        activeItem.click();
    } else {
        window.location.reload();
    }
}


/* =========================================================
   MONEY / CSV
   ========================================================= */

function formatMoney(amount) {
    return (
        (parseFloat(amount) || 0)
            .toLocaleString("vi-VN") +
        " đ"
    );
}


function downloadCSV(csv, filename) {
    const blob = new Blob(
        ["\uFEFF" + csv],
        {
            type: "text/csv;charset=utf-8;"
        }
    );

    const url = URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;
    link.download =
        filename || "goddy-export.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}


/* =========================================================
   CLIENT PORTAL / ROLE SWITCHER
   ========================================================= */

function switchUserRole(
    role,
    clientId = 1
) {
    currentUserRole = role;
    currentClientId = clientId;

    const roleBadge =
        document.getElementById(
            "roleBadge"
        );

    const navRoleTitle =
        document.getElementById(
            "navRoleTitle"
        );

    const sidebarMenuInternal =
        document.getElementById(
            "sidebarMenuInternal"
        );

    const sidebarMenuClient =
        document.getElementById(
            "sidebarMenuClient"
        );

    const sidebarFooterInternal =
        document.getElementById(
            "sidebarFooterInternal"
        );

    const sidebarFooterClient =
        document.getElementById(
            "sidebarFooterClient"
        );

    const sidebarLogoIcon =
        document.getElementById(
            "sidebarLogoIcon"
        );

    const sidebarMainTitle =
        document.getElementById(
            "sidebarMainTitle"
        );

    const sidebarSubTitle =
        document.getElementById(
            "sidebarSubTitle"
        );


    /* =====================================================
       CLIENT
       ===================================================== */

    if (role === "client") {
        const portalSection =
            document.getElementById(
                "section-client-portal"
            );

        if (!portalSection) {
            window.location.href =
                "client-portal.html?role=client&clientId=" +
                clientId;

            return;
        }

        if (sidebarMenuInternal) {
            sidebarMenuInternal.style.display =
                "none";
        }

        if (sidebarMenuClient) {
            sidebarMenuClient.style.display =
                "block";
        }

        if (sidebarFooterInternal) {
            sidebarFooterInternal.style.display =
                "none";
        }

        if (sidebarFooterClient) {
            sidebarFooterClient.style.display =
                "block";
        }

        if (sidebarLogoIcon) {
            sidebarLogoIcon.innerHTML =
                '<i class="fa-solid fa-building"></i>';
        }

        if (sidebarMainTitle) {
            sidebarMainTitle.textContent =
                "CỔNG KHÁCH HÀNG";
        }

        if (roleBadge) {
            roleBadge.className =
                "badge bg-primary rounded-pill px-2 py-1";

            roleBadge.textContent =
                "Khách hàng B2B";
        }

        const clientNames = {
            1: "FPT Software (Trần Thu Hà)",
            2: "VNG Corporation (Nguyễn Hoàng Long)",
            3: "Shopee Việt Nam (Lê Thùy Dương)"
        };

        const clientName =
            clientNames[clientId] ||
            "Doanh Nghiệp Đối Tác";

        if (navRoleTitle) {
            navRoleTitle.textContent =
                clientName;
        }

        if (sidebarSubTitle) {
            sidebarSubTitle.textContent =
                clientName
                    .split("(")[0]
                    .trim();
        }

        const internalSections = [
            "dashboard",
            "clients",
            "recruitment",
            "invoices",
            "debt",
            "audit"
        ];

        internalSections.forEach(
            function (section) {
                const element =
                    document.getElementById(
                        "section-" + section
                    );

                if (element) {
                    element.style.display =
                        "none";
                }
            }
        );

        portalSection.style.display =
            "block";

        const headerTitle =
            document.getElementById(
                "pageHeaderTitle"
            );

        if (headerTitle) {
            headerTitle.textContent =
                "Cổng Thông Tin Doanh Nghiệp - " +
                (
                    sidebarSubTitle
                        ? sidebarSubTitle.textContent
                        : ""
                );
        }

        if (
            typeof switchClientSubTab ===
            "function"
        ) {
            switchClientSubTab(
                "invoices"
            );
        }

        if (
            typeof loadClientPortal ===
            "function"
        ) {
            loadClientPortal(
                clientId
            );
        }

        return;
    }


    /* =====================================================
       INTERNAL USER
       ===================================================== */

    const dashboardSection =
        document.getElementById(
            "section-dashboard"
        );

    if (
        !dashboardSection &&
        window.location.pathname.includes(
            "client-portal"
        )
    ) {
        window.location.href =
            "index.html?role=" + role;

        return;
    }

    if (sidebarMenuInternal) {
        sidebarMenuInternal.style.display =
            "block";
    }

    if (sidebarMenuClient) {
        sidebarMenuClient.style.display =
            "none";
    }

    if (sidebarFooterInternal) {
        sidebarFooterInternal.style.display =
            "block";
    }

    if (sidebarFooterClient) {
        sidebarFooterClient.style.display =
            "none";
    }

    if (sidebarLogoIcon) {
        sidebarLogoIcon.innerHTML =
            '<i class="fa-solid fa-chart-pie"></i>';
    }

    if (sidebarMainTitle) {
        sidebarMainTitle.textContent =
            "GODDY RECRUIT";
    }

    if (sidebarSubTitle) {
        sidebarSubTitle.textContent =
            "Quản Lý Công Nợ B2B";
    }

    const clientPortalSection =
        document.getElementById(
            "section-client-portal"
        );

    if (clientPortalSection) {
        clientPortalSection.style.display =
            "none";
    }


    if (role === "admin") {
        if (roleBadge) {
            roleBadge.className =
                "badge bg-danger rounded-pill px-2 py-1";

            roleBadge.textContent =
                "Admin";
        }

        if (navRoleTitle) {
            navRoleTitle.textContent =
                "Huỳnh Nguyễn Vĩnh Phúc";
        }

    } else if (role === "accountant") {
        if (roleBadge) {
            roleBadge.className =
                "badge bg-success rounded-pill px-2 py-1";

            roleBadge.textContent =
                "Kế toán";
        }

        if (navRoleTitle) {
            navRoleTitle.textContent =
                "Phạm Sơn (Kế toán trưởng)";
        }

    } else if (role === "recruiter") {
        if (roleBadge) {
            roleBadge.className =
                "badge bg-warning text-dark rounded-pill px-2 py-1";

            roleBadge.textContent =
                "Recruiter";
        }

        if (navRoleTitle) {
            navRoleTitle.textContent =
                "Nguyễn Văn Minh (Senior)";
        }
    }

    if (dashboardSection) {
        switchTab("dashboard");
    }
}


/* =========================================================
   LOGIN MODAL
   ========================================================= */

function openLoginModal() {
    const modalElement =
        document.getElementById(
            "modalLogin"
        );

    if (
        modalElement &&
        typeof bootstrap !== "undefined" &&
        bootstrap.Modal
    ) {
        new bootstrap.Modal(
            modalElement
        ).show();

        return;
    }

    if (modalElement) {
        modalElement.style.display =
            "block";

        return;
    }

    alert(
        "Không tìm thấy hộp thoại đăng nhập!"
    );
}


function quickFillLogin(
    username,
    password
) {
    const usernameInput =
        document.getElementById(
            "loginUsername"
        );

    const passwordInput =
        document.getElementById(
            "loginPassword"
        );

    if (usernameInput) {
        usernameInput.value =
            username;
    }

    if (passwordInput) {
        passwordInput.value =
            password;
    }
}


/* =========================================================
   LOGIN
   ========================================================= */

async function submitLogin(event) {
    event.preventDefault();

    const usernameInput =
        document.getElementById(
            "loginUsername"
        );

    const passwordInput =
        document.getElementById(
            "loginPassword"
        );

    if (
        !usernameInput ||
        !passwordInput
    ) {
        return;
    }

    const username =
        usernameInput.value.trim();

    const password =
        passwordInput.value;

    if (!username || !password) {
        alert(
            "Vui lòng nhập đầy đủ tài khoản và mật khẩu."
        );

        return;
    }

    try {
        const response =
            await fetch(
                "/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        username:
                            username,
                        password:
                            password
                    })
                }
            );

        const data =
            await response.json();

        if (data.success) {
            if (data.token) {
                localStorage.setItem(
                    "goddy_token",
                    data.token
                );

                currentToken =
                    data.token;
            }

            if (data.user) {
                localStorage.setItem(
                    "goddy_user",
                    JSON.stringify(
                        data.user
                    )
                );

                currentUser =
                    data.user;

                if (
                    data.user.role
                ) {
                    currentUserRole =
                        data.user.role;
                }

                if (
                    data.user.clientId
                ) {
                    currentClientId =
                        data.user.clientId;
                }
            }

            const modalElement =
                document.getElementById(
                    "modalLogin"
                );

            if (
                modalElement &&
                typeof bootstrap !==
                "undefined" &&
                bootstrap.Modal
            ) {
                const modalInstance =
                    bootstrap.Modal.getInstance(
                        modalElement
                    );

                if (modalInstance) {
                    modalInstance.hide();
                }
            }

            const role =
                data.user &&
                    data.user.role
                    ? data.user.role
                    : "";

            alert(
                "Đăng nhập thành công với vai trò: " +
                role.toUpperCase()
            );

            if (role === "client") {
                switchUserRole(
                    "client",
                    data.user.clientId || 1
                );
            } else {
                switchUserRole(
                    role
                );
            }

        } else {
            alert(
                data.message ||
                "Đăng nhập thất bại!"
            );
        }

    } catch (error) {
        console.error(
            "Login error:",
            error
        );

        alert(
            "Lỗi kết nối máy chủ!"
        );
    }
}


/* =========================================================
   DOM HELPERS
   ========================================================= */

function select(
    selector,
    parent
) {
    return (
        parent || document
    ).querySelector(
        selector
    );
}


function selectAll(
    selector,
    parent
) {
    return Array.from(
        (
            parent || document
        ).querySelectorAll(
            selector
        )
    );
}


function elementById(id) {
    return document.getElementById(
        id
    );
}


/* =========================================================
   STRING UTILITIES
   ========================================================= */

function escapeHtml(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


function truncateText(
    value,
    maxLength
) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    const text =
        String(value);

    const limit =
        Number(maxLength);

    if (
        !limit ||
        text.length <= limit
    ) {
        return text;
    }

    return (
        text.substring(
            0,
            limit - 3
        ) + "..."
    );
}


/* =========================================================
   NUMBER UTILITIES
   ========================================================= */

function formatNumber(
    value,
    options
) {
    let number =
        Number(value);

    if (
        !Number.isFinite(number)
    ) {
        number = 0;
    }

    try {
        return new Intl.NumberFormat(
            "vi-VN",
            options || {}
        ).format(number);
    } catch (error) {
        return String(number);
    }
}


function formatCurrency(
    value,
    currency
) {
    const code =
        currency || "VND";

    let number =
        Number(value);

    if (
        !Number.isFinite(number)
    ) {
        number = 0;
    }

    try {
        return new Intl.NumberFormat(
            "vi-VN",
            {
                style: "currency",
                currency: code,
                maximumFractionDigits:
                    code === "VND"
                        ? 0
                        : 2
            }
        ).format(number);

    } catch (error) {
        return (
            formatNumber(number) +
            " " +
            code
        );
    }
}


/* =========================================================
   DATE UTILITIES
   ========================================================= */

function parseDate(
    value
) {
    if (!value) {
        return null;
    }

    if (
        value instanceof Date
    ) {
        return Number.isNaN(
            value.getTime()
        )
            ? null
            : value;
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    return date;
}


function formatDate(
    value
) {
    const date =
        parseDate(value);

    if (!date) {
        return "";
    }

    return date.toLocaleDateString(
        "vi-VN"
    );
}


function formatDateTime(
    value
) {
    const date =
        parseDate(value);

    if (!date) {
        return "";
    }

    return date.toLocaleString(
        "vi-VN"
    );
}


/* =========================================================
   LOCAL STORAGE HELPERS
   ========================================================= */

function storageGet(
    key,
    fallback
) {
    try {
        const value =
            localStorage.getItem(
                key
            );

        if (value === null) {
            return fallback;
        }

        try {
            return JSON.parse(
                value
            );
        } catch (error) {
            return value;
        }

    } catch (error) {
        return fallback;
    }
}


function storageSet(
    key,
    value
) {
    try {
        const storedValue =
            typeof value === "string"
                ? value
                : JSON.stringify(
                    value
                );

        localStorage.setItem(
            key,
            storedValue
        );

        return true;

    } catch (error) {
        console.error(
            "storageSet error:",
            error
        );

        return false;
    }
}


function storageRemove(
    key
) {
    try {
        localStorage.removeItem(
            key
        );

        return true;

    } catch (error) {
        return false;
    }
}


/* =========================================================
   UI VISIBILITY
   ========================================================= */

function showElement(
    element
) {
    if (!element) {
        return;
    }

    element.hidden = false;

    element.removeAttribute(
        "hidden"
    );

    element.style.removeProperty(
        "display"
    );
}


function hideElement(
    element
) {
    if (!element) {
        return;
    }

    element.hidden = true;

    element.setAttribute(
        "hidden",
        ""
    );
}


function toggleElement(
    element,
    force
) {
    if (!element) {
        return false;
    }

    const shouldShow =
        typeof force === "boolean"
            ? force
            : element.hidden;

    if (shouldShow) {
        showElement(element);
    } else {
        hideElement(element);
    }

    return shouldShow;
}


/* =========================================================
   CLASS HELPERS
   ========================================================= */

function addClass(
    element,
    className
) {
    if (
        !element ||
        !className
    ) {
        return;
    }

    element.classList.add(
        className
    );
}


function removeClass(
    element,
    className
) {
    if (
        !element ||
        !className
    ) {
        return;
    }

    element.classList.remove(
        className
    );
}


function toggleClass(
    element,
    className,
    force
) {
    if (
        !element ||
        !className
    ) {
        return false;
    }

    return element.classList.toggle(
        className,
        force
    );
}


/* =========================================================
   TOAST
   ========================================================= */

function createToastContainer() {
    let container =
        document.getElementById(
            "goddy-toast-container"
        );

    if (container) {
        return container;
    }

    container =
        document.createElement(
            "div"
        );

    container.id =
        "goddy-toast-container";

    container.className =
        "goddy-toast-container";

    document.body.appendChild(
        container
    );

    return container;
}


function showToast(
    message,
    type,
    duration
) {
    if (!message) {
        return null;
    }

    const container =
        createToastContainer();

    const toast =
        document.createElement(
            "div"
        );

    const validTypes = [
        "success",
        "info",
        "warning",
        "danger"
    ];

    let toastType =
        type || "info";

    if (
        !validTypes.includes(
            toastType
        )
    ) {
        toastType = "info";
    }

    toast.className =
        "goddy-toast goddy-toast-" +
        toastType;

    toast.setAttribute(
        "role",
        "status"
    );

    toast.innerHTML =
        '<div class="goddy-toast-content">' +
        escapeHtml(message) +
        "</div>" +
        '<button type="button" ' +
        'class="goddy-toast-close" ' +
        'aria-label="Đóng thông báo">' +
        "&times;" +
        "</button>";

    container.appendChild(
        toast
    );

    const closeButton =
        toast.querySelector(
            ".goddy-toast-close"
        );

    const removeToast =
        function () {
            if (!toast.parentNode) {
                return;
            }

            toast.classList.add(
                "is-leaving"
            );

            window.setTimeout(
                function () {
                    if (
                        toast.parentNode
                    ) {
                        toast.parentNode.removeChild(
                            toast
                        );
                    }
                },
                200
            );
        };

    if (closeButton) {
        closeButton.addEventListener(
            "click",
            removeToast
        );
    }

    window.setTimeout(
        removeToast,
        Number(duration) || 3500
    );

    return toast;
}


function showMessage(
    message,
    type,
    duration
) {
    return showToast(
        message,
        type,
        duration
    );
}


/* =========================================================
   CONFIRM
   ========================================================= */

function confirmAction(
    message
) {
    return window.confirm(
        message ||
        "Bạn có chắc chắn muốn thực hiện thao tác này?"
    );
}


/* =========================================================
   FORM VALIDATION
   ========================================================= */

function clearFormErrors(
    form
) {
    if (!form) {
        return;
    }

    form.querySelectorAll(
        ".field-error"
    ).forEach(
        function (element) {
            element.textContent =
                "";

            element.hidden =
                true;
        }
    );

    form.querySelectorAll(
        ".is-invalid"
    ).forEach(
        function (element) {
            element.classList.remove(
                "is-invalid"
            );
        }
    );
}


function showFieldError(
    field,
    message
) {
    if (!field) {
        return;
    }

    field.classList.add(
        "is-invalid"
    );

    const fieldId =
        field.id;

    if (!fieldId) {
        return;
    }

    const errorElement =
        document.querySelector(
            '[data-error-for="' +
            fieldId +
            '"]'
        );

    if (!errorElement) {
        return;
    }

    errorElement.textContent =
        message || "";

    errorElement.hidden =
        !message;
}


function validateRequiredFields(
    form
) {
    if (!form) {
        return false;
    }

    clearFormErrors(
        form
    );

    let valid = true;

    form.querySelectorAll(
        "[required]"
    ).forEach(
        function (field) {
            const value =
                String(
                    field.value || ""
                ).trim();

            if (!value) {
                showFieldError(
                    field,
                    "Trường này là bắt buộc."
                );

                valid = false;
            }
        }
    );

    if (!valid) {
        const firstInvalid =
            form.querySelector(
                ".is-invalid"
            );

        if (firstInvalid) {
            firstInvalid.focus();
        }
    }

    return valid;
}


/* =========================================================
   BUTTON LOADING
   ========================================================= */

function setButtonLoading(
    button,
    loading,
    loadingText
) {
    if (!button) {
        return;
    }

    if (loading) {
        if (
            !button.dataset
                .originalText
        ) {
            button.dataset
                .originalText =
                button.innerHTML;
        }

        button.disabled = true;

        button.innerHTML =
            '<span class="button-spinner" ' +
            'aria-hidden="true"></span>' +
            "<span>" +
            escapeHtml(
                loadingText ||
                "Đang xử lý..."
            ) +
            "</span>";

    } else {
        button.disabled = false;

        if (
            button.dataset
                .originalText
        ) {
            button.innerHTML =
                button.dataset
                    .originalText;

            delete button.dataset
                .originalText;
        }
    }
}


/* =========================================================
   MODAL HELPERS
   ========================================================= */

function openModal(
    modal
) {
    const target =
        typeof modal === "string"
            ? select(modal)
            : modal;

    if (!target) {
        return;
    }

    /*
     * Hỗ trợ Bootstrap nếu project
     * đang sử dụng Bootstrap.
     */
    if (
        typeof bootstrap !==
        "undefined" &&
        bootstrap.Modal
    ) {
        const instance =
            bootstrap.Modal.getOrCreateInstance(
                target
            );

        instance.show();

        return;
    }

    target.hidden = false;

    target.removeAttribute(
        "hidden"
    );

    target.classList.add(
        "is-open"
    );

    document.body.classList.add(
        "modal-open"
    );
}


function closeModal(
    modal
) {
    const target =
        typeof modal === "string"
            ? select(modal)
            : modal;

    if (!target) {
        return;
    }

    if (
        typeof bootstrap !==
        "undefined" &&
        bootstrap.Modal
    ) {
        const instance =
            bootstrap.Modal.getInstance(
                target
            );

        if (instance) {
            instance.hide();
            return;
        }
    }

    target.classList.remove(
        "is-open"
    );

    target.hidden = true;

    target.setAttribute(
        "hidden",
        ""
    );

    document.body.classList.remove(
        "modal-open"
    );
}


function closeModalByClickOutside(
    event
) {
    const modal =
        event.currentTarget;

    if (
        event.target === modal
    ) {
        closeModal(
            modal
        );
    }
}


/* =========================================================
   PERFORMANCE HELPERS
   ========================================================= */

function debounce(
    callback,
    wait
) {
    let timeoutId = null;

    return function () {
        const context =
            this;

        const args =
            arguments;

        window.clearTimeout(
            timeoutId
        );

        timeoutId =
            window.setTimeout(
                function () {
                    callback.apply(
                        context,
                        args
                    );
                },
                Number(wait) || 300
            );
    };
}


function throttle(
    callback,
    wait
) {
    let waiting = false;

    return function () {
        if (waiting) {
            return;
        }

        callback.apply(
            this,
            arguments
        );

        waiting = true;

        window.setTimeout(
            function () {
                waiting = false;
            },
            Number(wait) || 200
        );
    };
}


/* =========================================================
   URL HELPERS
   ========================================================= */

function getQueryParams() {
    const params =
        new URLSearchParams(
            window.location.search
        );

    const result = {};

    params.forEach(
        function (value, key) {
            result[key] = value;
        }
    );

    return result;
}


function getQueryParam(
    name,
    fallback
) {
    const params =
        new URLSearchParams(
            window.location.search
        );

    const value =
        params.get(name);

    return value === null
        ? fallback
        : value;
}


function updateQueryParam(
    name,
    value
) {
    const url =
        new URL(
            window.location.href
        );

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        url.searchParams.delete(
            name
        );
    } else {
        url.searchParams.set(
            name,
            value
        );
    }

    window.history.replaceState(
        {},
        "",
        url.toString()
    );
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function navigate(
    url
) {
    if (!url) {
        return;
    }

    window.location.href =
        url;
}


function reloadPage() {
    window.location.reload();
}


/* =========================================================
   CLIPBOARD
   ========================================================= */

async function copyToClipboard(
    value
) {
    if (
        value === null ||
        value === undefined
    ) {
        return false;
    }

    try {
        if (
            navigator.clipboard &&
            navigator.clipboard.writeText
        ) {
            await navigator.clipboard.writeText(
                String(value)
            );

            return true;
        }
    } catch (error) {
        console.warn(
            "Clipboard API không khả dụng.",
            error
        );
    }

    try {
        const textarea =
            document.createElement(
                "textarea"
            );

        textarea.value =
            String(value);

        textarea.style.position =
            "fixed";

        textarea.style.opacity =
            "0";

        document.body.appendChild(
            textarea
        );

        textarea.select();

        const success =
            document.execCommand(
                "copy"
            );

        document.body.removeChild(
            textarea
        );

        return success;

    } catch (error) {
        return false;
    }
}


/* =========================================================
   GENERAL HELPERS
   ========================================================= */

function valueOrDefault(
    value,
    fallback
) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return fallback;
    }

    return value;
}


function safeJsonParse(
    value,
    fallback
) {
    try {
        return JSON.parse(
            value
        );
    } catch (error) {
        return fallback;
    }
}


function isEmpty(
    value
) {
    if (
        value === null ||
        value === undefined
    ) {
        return true;
    }

    if (
        typeof value === "string"
    ) {
        return (
            value.trim() === ""
        );
    }

    if (
        Array.isArray(value)
    ) {
        return (
            value.length === 0
        );
    }

    return false;
}


/* =========================================================
   GODDY COMMON NAMESPACE
   ========================================================= */

window.GoddyCommon = {
    /* DOM */
    $: select,
    $$: selectAll,
    byId: elementById,

    /* String */
    escapeHtml: escapeHtml,
    truncate: truncateText,

    /* Number */
    formatNumber: formatNumber,
    formatCurrency: formatCurrency,

    /* Date */
    parseDate: parseDate,
    formatDate: formatDate,
    formatDateTime:
        formatDateTime,

    /* Storage */
    storageGet: storageGet,
    storageSet: storageSet,
    storageRemove:
        storageRemove,

    /* UI */
    showElement: showElement,
    hideElement: hideElement,
    toggleElement:
        toggleElement,

    addClass: addClass,
    removeClass: removeClass,
    toggleClass: toggleClass,

    /* Message */
    showToast: showToast,
    showMessage: showMessage,
    confirmAction:
        confirmAction,

    /* Form */
    clearFormErrors:
        clearFormErrors,
    showFieldError:
        showFieldError,
    validateRequiredFields:
        validateRequiredFields,

    /* Button */
    setButtonLoading:
        setButtonLoading,

    /* Modal */
    openModal: openModal,
    closeModal: closeModal,
    closeModalByClickOutside:
        closeModalByClickOutside,

    /* Performance */
    debounce: debounce,
    throttle: throttle,

    /* URL */
    getQueryParams:
        getQueryParams,
    getQueryParam:
        getQueryParam,
    updateQueryParam:
        updateQueryParam,

    /* Navigation */
    navigate: navigate,
    reloadPage: reloadPage,

    /* Clipboard */
    copyToClipboard:
        copyToClipboard,

    /* General */
    valueOrDefault:
        valueOrDefault,
    safeJsonParse:
        safeJsonParse,
    isEmpty: isEmpty
};


/* =========================================================
   BACKWARD COMPATIBILITY
   ========================================================= */

window.showMessage =
    showMessage;

window.showToast =
    showToast;

window.confirmAction =
    confirmAction;

window.formatCurrency =
    formatCurrency;

window.formatDate =
    formatDate;

window.formatDateTime =
    formatDateTime;


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {
        document.documentElement.classList.add(
            "goddy-ready"
        );

        console.log(
            "GODDY ERP Common JavaScript initialized."
        );
    }
);


/* =========================================================
   AUTO INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {
        const urlParams =
            new URLSearchParams(
                window.location.search
            );

        const roleParam =
            urlParams.get("role");

        const clientParam =
            parseInt(
                urlParams.get("clientId"),
                10
            ) || 1;

        if (
            roleParam === "client"
        ) {
            switchUserRole(
                "client",
                clientParam
            );

        } else if (
            roleParam === "accountant" ||
            roleParam === "ketoan"
        ) {
            switchUserRole(
                "accountant"
            );

        } else if (
            roleParam === "recruiter"
        ) {
            switchUserRole(
                "recruiter"
            );

        } else {
            /*
             * Chỉ tự động load dashboard
             * nếu trang thực sự có section dashboard.
             */
            if (
                document.getElementById(
                    "section-dashboard"
                ) &&
                typeof loadDashboard ===
                "function"
            ) {
                loadDashboard();
            }
        }
    }
);