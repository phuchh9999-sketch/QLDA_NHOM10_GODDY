"use strict";

/* =========================================================
   GODDY ERP - Login
   FE-09: NGUYEN_HOANG_PHUOC
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       GET DOM ELEMENTS
       ===================================================== */

    const loginForm =
        document.getElementById("loginForm");

    const identifierInput =
        document.getElementById("loginIdentifier");

    const passwordInput =
        document.getElementById("loginPassword");

    const passwordToggle =
        document.getElementById("passwordToggle");

    const rememberMe =
        document.getElementById("rememberMe");

    const forgotPasswordLink =
        document.getElementById("forgotPasswordLink");

    const loginMessage =
        document.getElementById("loginMessage");

    const loginSubmit =
        document.getElementById("loginSubmit");

    const loginSubmitText =
        document.getElementById("loginSubmitText");


    /* =====================================================
       CHECK DOM ELEMENTS
       ===================================================== */

    if (!(loginForm instanceof HTMLFormElement)) {
        console.error("Không tìm thấy loginForm.");
        return;
    }

    if (!(identifierInput instanceof HTMLInputElement)) {
        console.error("Không tìm thấy identifierInput.");
        return;
    }

    if (!(passwordInput instanceof HTMLInputElement)) {
        console.error("Không tìm thấy passwordInput.");
        return;
    }

    if (!(passwordToggle instanceof HTMLButtonElement)) {
        console.error("Không tìm thấy passwordToggle.");
        return;
    }

    if (!(rememberMe instanceof HTMLInputElement)) {
        console.error("Không tìm thấy rememberMe.");
        return;
    }

    if (!(forgotPasswordLink instanceof HTMLAnchorElement)) {
        console.error("Không tìm thấy forgotPasswordLink.");
        return;
    }

    if (!(loginMessage instanceof HTMLElement)) {
        console.error("Không tìm thấy loginMessage.");
        return;
    }

    if (!(loginSubmit instanceof HTMLButtonElement)) {
        console.error("Không tìm thấy loginSubmit.");
        return;
    }

    if (!(loginSubmitText instanceof HTMLElement)) {
        console.error("Không tìm thấy loginSubmitText.");
        return;
    }


    /* =====================================================
       SHOW MESSAGE
       ===================================================== */

    function showLoginMessage(message, type) {

        loginMessage.textContent = "";

        const messageElement =
            document.createElement("div");

        messageElement.className =
            "login-notification login-notification-" +
            type;

        messageElement.textContent =
            message;

        loginMessage.appendChild(
            messageElement
        );
    }


    /* =====================================================
       CLEAR MESSAGE
       ===================================================== */

    function clearLoginMessage() {

        loginMessage.textContent = "";

    }


    /* =====================================================
       LOAD REMEMBERED USERNAME
       ===================================================== */

    const rememberedIdentifier =
        localStorage.getItem(
            "goddy_login_identifier"
        );

    if (rememberedIdentifier) {

        identifierInput.value =
            rememberedIdentifier;

        rememberMe.checked =
            true;
    }


    /* =====================================================
       PASSWORD SHOW / HIDE
       ===================================================== */

    passwordToggle.addEventListener(
        "click",
        function () {

            const isPassword =
                passwordInput.type === "password";


            if (isPassword) {

                passwordInput.type =
                    "text";

                passwordToggle.textContent =
                    "🙈";

                passwordToggle.setAttribute(
                    "aria-label",
                    "Ẩn mật khẩu"
                );

                passwordToggle.setAttribute(
                    "title",
                    "Ẩn mật khẩu"
                );

            } else {

                passwordInput.type =
                    "password";

                passwordToggle.textContent =
                    "👁";

                passwordToggle.setAttribute(
                    "aria-label",
                    "Hiện mật khẩu"
                );

                passwordToggle.setAttribute(
                    "title",
                    "Hiện mật khẩu"
                );

            }

        }
    );


    /* =====================================================
       FORGOT PASSWORD
       ===================================================== */

    forgotPasswordLink.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            showLoginMessage(
                "Tính năng khôi phục mật khẩu sẽ được kết nối với API ở bước tiếp theo.",
                "info"
            );

        }
    );


    /* =====================================================
       LOGIN SUBMIT
       ===================================================== */

    loginForm.addEventListener(
        "submit",
        async function (event) {

            /* ---------------------------------------------
               STOP NORMAL HTML SUBMIT
               --------------------------------------------- */

            event.preventDefault();
            event.stopPropagation();


            /* ---------------------------------------------
               CLEAR OLD MESSAGE
               --------------------------------------------- */

            clearLoginMessage();


            /* ---------------------------------------------
               GET VALUES
               --------------------------------------------- */

            const identifier =
                identifierInput.value.trim();

            const password =
                passwordInput.value;


            /* ---------------------------------------------
               VALIDATE USERNAME
               --------------------------------------------- */

            if (!identifier) {

                showLoginMessage(
                    "Vui lòng nhập Email hoặc tên đăng nhập.",
                    "danger"
                );

                identifierInput.focus();

                return;
            }


            /* ---------------------------------------------
               VALIDATE PASSWORD
               --------------------------------------------- */

            if (!password) {

                showLoginMessage(
                    "Vui lòng nhập mật khẩu.",
                    "danger"
                );

                passwordInput.focus();

                return;
            }


            /* ---------------------------------------------
               REMEMBER LOGIN
               --------------------------------------------- */

            if (rememberMe.checked) {

                localStorage.setItem(
                    "goddy_login_identifier",
                    identifier
                );

            } else {

                localStorage.removeItem(
                    "goddy_login_identifier"
                );

            }


            /* ---------------------------------------------
               LOADING
               --------------------------------------------- */

            loginSubmit.disabled =
                true;

            loginSubmitText.innerHTML = `
                <span class="login-spinner"></span>
                Đang đăng nhập...
            `;


            /* ---------------------------------------------
               LOGIN API
               --------------------------------------------- */

            try {

                const goddyAPI =
                    window.GoddyAPI;


                /* -----------------------------------------
                   CHECK API
                   ----------------------------------------- */

                if (
                    !goddyAPI ||
                    typeof goddyAPI.post !== "function"
                ) {

                    throw new Error(
                        "GoddyAPI chưa được tải. Vui lòng kiểm tra file api.js."
                    );
                }


                /* -----------------------------------------
                   SEND LOGIN REQUEST
                   ----------------------------------------- */

                const response =
                    await goddyAPI.post(
                        "/auth/login",
                        {
                            identifier: identifier,
                            password: password
                        }
                    );


                /* -----------------------------------------
                   SAVE TOKEN
                   ----------------------------------------- */

                if (
                    response &&
                    response.token
                ) {

                    localStorage.setItem(
                        "goddy_auth_token",
                        response.token
                    );
                }


                /* -----------------------------------------
                   SUCCESS
                   ----------------------------------------- */

                showLoginMessage(
                    "Đăng nhập thành công.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "GODDY ERP Login Error:",
                    error
                );


                let errorMessage =
                    "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";


                if (
                    error &&
                    typeof error.message === "string"
                ) {

                    errorMessage =
                        error.message;
                }


                showLoginMessage(
                    errorMessage,
                    "danger"
                );


            } finally {

                /* -----------------------------------------
                   RESTORE BUTTON
                   ----------------------------------------- */

                loginSubmit.disabled =
                    false;

                loginSubmitText.textContent =
                    "Đăng nhập";

            }

        }
    );

});