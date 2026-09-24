/* =========================================================
   QLDA_NHOM10_GODDY
   Frontend - NGUYEN_HOANG_PHUOC
   FE-03: JavaScript dùng chung
   ========================================================= */

/**
 * Hiển thị thông báo đơn giản.
 */
function showMessage(message, type = "info") {
    console.log(`[${type.toUpperCase()}] ${message}`);
}


/**
 * Xác nhận một thao tác trước khi thực hiện.
 */
function confirmAction(message) {
    return window.confirm(message);
}


/**
 * Định dạng số tiền Việt Nam.
 */
function formatCurrency(value) {
    const number = Number(value);

    if (Number.isNaN(number)) {
        return "0 ₫";
    }

    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND"
    }).format(number);
}


/**
 * Định dạng ngày tháng.
 */
function formatDate(dateValue) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleDateString("vi-VN");
}


/**
 * Hiển thị/ẩn phần tử HTML.
 */
function toggleElement(elementId, visible) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.style.display = visible ? "" : "none";
}


/**
 * Chạy khi trang đã tải xong.
 */
document.addEventListener("DOMContentLoaded", function () {
    console.log("QLDA_NHOM10_GODDY - Frontend loaded.");
});