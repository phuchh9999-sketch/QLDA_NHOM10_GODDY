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
/* =========================================
   FE-07: FORM VALIDATION
   NGUYEN_HOANG_PHUOC
   ========================================= */

function validateRequiredFields(form) {
    if (!form) {
        return false;
    }

    const requiredFields = form.querySelectorAll(
        "[required]"
    );

    let isValid = true;

    requiredFields.forEach(function (field) {
        const value = field.value.trim();

        field.classList.remove("is-invalid");

        const oldError = field.parentElement.querySelector(
            ".form-error"
        );

        if (oldError) {
            oldError.remove();
        }

        if (!value) {
            isValid = false;

            field.classList.add("is-invalid");

            const error = document.createElement("span");
            error.className = "form-error";
            error.textContent = "Vui lòng nhập thông tin này.";

            field.parentElement.appendChild(error);
        }
    });

    return isValid;
}

function clearFormErrors(form) {
    if (!form) {
        return;
    }

    form.querySelectorAll(".is-invalid").forEach(function (field) {
        field.classList.remove("is-invalid");
    });

    form.querySelectorAll(".form-error").forEach(function (error) {
        error.remove();
    });
}