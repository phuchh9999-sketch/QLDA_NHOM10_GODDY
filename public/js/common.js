/* =========================================================
   GODDY ERP - COMMON JAVASCRIPT
   FE-03 + FE-07 + FE-08
   NGUYEN_HOANG_PHUOC
   ========================================================= */


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
    message,
    type = "info"
) {

    alert(
        `[${type.toUpperCase()}] ${message}`
    );

}


/* =========================================================
   CONFIRM
   ========================================================= */

function confirmAction(
    message
) {

    return window.confirm(
        message
    );

}


/* =========================================================
   CURRENCY
   ========================================================= */

function formatCurrency(
    value
) {

    const number =
        Number(value) || 0;

    return new Intl.NumberFormat(
        "vi-VN",
        {
            style: "currency",
            currency: "VND"
        }
    ).format(number);

}


/* =========================================================
   DATE
   ========================================================= */

function formatDate(
    value
) {

    if (!value) {

        return "";

    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }

    return new Intl.DateTimeFormat(
        "vi-VN"
    ).format(date);

}


/* =========================================================
   TOGGLE ELEMENT
   ========================================================= */

function toggleElement(
    elementId
) {

    const element =
        document.getElementById(
            elementId
        );

    if (!element) {

        return;

    }

    const isHidden =
        element.style.display ===
        "none";

    element.style.display =
        isHidden
            ? ""
            : "none";

}


/* =========================================================
   SHOW FIELD ERROR
   ========================================================= */

function showFieldError(
    field,
    message
) {

    if (!field) {

        return;

    }

    field.classList.add(
        "is-error"
    );

    const formGroup =
        field.closest(
            ".form-group"
        );

    if (!formGroup) {

        return;

    }

    let errorElement =
        formGroup.querySelector(
            ".form-error"
        );

    if (!errorElement) {

        errorElement =
            document.createElement(
                "p"
            );

        errorElement.className =
            "form-error";

        formGroup.appendChild(
            errorElement
        );

    }

    errorElement.textContent =
        message;

    errorElement.classList.add(
        "is-visible"
    );

}


/* =========================================================
   CLEAR FIELD ERROR
   ========================================================= */

function clearFieldError(
    field
) {

    if (!field) {

        return;

    }

    field.classList.remove(
        "is-error"
    );

    const formGroup =
        field.closest(
            ".form-group"
        );

    if (!formGroup) {

        return;

    }

    const errorElement =
        formGroup.querySelector(
            ".form-error"
        );

    if (errorElement) {

        errorElement.textContent =
            "";

        errorElement.classList.remove(
            "is-visible"
        );

    }

}


/* =========================================================
   VALIDATE REQUIRED FIELDS
   ========================================================= */

function validateRequiredFields(
    form
) {

    if (!form) {

        return false;

    }

    let isValid = true;

    const requiredFields =
        form.querySelectorAll(
            "[required]"
        );

    requiredFields.forEach(
        function (field) {

            if (
                !(field instanceof
                    HTMLInputElement) &&
                !(field instanceof
                    HTMLSelectElement) &&
                !(field instanceof
                    HTMLTextAreaElement)
            ) {

                return;

            }

            clearFieldError(
                field
            );

            const value =
                field.value.trim();

            if (
                value === ""
            ) {

                showFieldError(
                    field,
                    "Trường này là bắt buộc."
                );

                isValid = false;

            }

        }
    );

    return isValid;

}


/* =========================================================
   CLEAR FORM ERRORS
   ========================================================= */

function clearFormErrors(
    form
) {

    if (!form) {

        return;

    }

    const fields =
        form.querySelectorAll(
            ".is-error"
        );

    fields.forEach(
        function (field) {

            field.classList.remove(
                "is-error"
            );

        }
    );

    const errors =
        form.querySelectorAll(
            ".form-error"
        );

    errors.forEach(
        function (error) {

            error.textContent =
                "";

            error.classList.remove(
                "is-visible"
            );

        }
    );

}


/* =========================================================
   MODAL - OPEN
   ========================================================= */

function openModal(
    modalId
) {

    const modal =
        document.getElementById(
            modalId
        );

    if (!modal) {

        return;

    }

    modal.classList.add(
        "is-open"
    );

    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   MODAL - CLOSE
   ========================================================= */

function closeModal(
    modalId
) {

    const modal =
        document.getElementById(
            modalId
        );

    if (!modal) {

        return;

    }

    modal.classList.remove(
        "is-open"
    );

    document.body.style.overflow =
        "";

}


/* =========================================================
   MODAL - CLOSE OUTSIDE
   ========================================================= */

function closeModalByClickOutside(
    event,
    modal
) {

    if (!modal) {

        return;

    }

    if (
        event.target === modal
    ) {

        modal.classList.remove(
            "is-open"
        );

        document.body.style.overflow =
            "";

    }

}


/* =========================================================
   BUTTON LOADING
   ========================================================= */

function setButtonLoading(
    button,
    isLoading
) {

    if (!button) {

        return;

    }

    if (isLoading) {

        button.classList.add(
            "is-loading"
        );

        button.disabled = true;

    } else {

        button.classList.remove(
            "is-loading"
        );

        button.disabled = false;

    }

}


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "GODDY ERP - Common JS loaded."
        );

    }
);