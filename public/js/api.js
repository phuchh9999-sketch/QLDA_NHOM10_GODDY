/**
 * GODDY RECRUIT - API Layer
 * FE-06 / FE-07 / FE-33
 *
 * Mục đích:
 * - Tập trung toàn bộ giao tiếp giữa Frontend và Backend API
 * - Tự động gắn token đăng nhập khi gọi API
 * - Chuẩn hóa xử lý response / error
 * - Cho phép Frontend chạy file:// hoặc HTTP nhưng API luôn gọi Backend thật
 */

(function (window) {
    'use strict';

    // =========================================================
    // CONFIG
    // =========================================================

    const API_BASE_URL =
        'http://localhost:3000/api';

    const TOKEN_KEY =
        'goddy_token';

    const USER_KEY =
        'goddy_user';


    // =========================================================
    // STORAGE
    // =========================================================

    function getToken() {

        return (
            localStorage.getItem(
                TOKEN_KEY
            ) || ''
        );

    }


    function getUser() {

        const rawUser =
            localStorage.getItem(
                USER_KEY
            );

        if (!rawUser) {

            return null;

        }


        try {

            return JSON.parse(
                rawUser
            );

        } catch (error) {

            console.warn(
                'GoddyAPI: Không thể đọc goddy_user.',
                error
            );

            return null;

        }

    }


    function setAuth(
        token,
        user
    ) {

        if (token) {

            localStorage.setItem(
                TOKEN_KEY,
                token
            );

        }


        if (user) {

            localStorage.setItem(
                USER_KEY,
                JSON.stringify(
                    user
                )
            );

        }

    }


    function clearAuth() {

        localStorage.removeItem(
            TOKEN_KEY
        );

        localStorage.removeItem(
            USER_KEY
        );

    }


    // =========================================================
    // BUILD REQUEST HEADERS
    // =========================================================

    function buildHeaders(
        customHeaders = {}
    ) {

        const headers = {

            'Content-Type':
                'application/json',

            ...customHeaders

        };


        const token =
            getToken();


        if (token) {

            headers.Authorization =
                `Bearer ${token}`;

        }


        return headers;

    }


    // =========================================================
    // BUILD URL
    // =========================================================

    function buildUrl(
        endpoint
    ) {

        if (!endpoint) {

            return API_BASE_URL;

        }


        if (
            endpoint.startsWith(
                'http://'
            ) ||
            endpoint.startsWith(
                'https://'
            )
        ) {

            return endpoint;

        }


        if (
            endpoint.startsWith(
                '/api/'
            )
        ) {

            return (
                'http://localhost:3000' +
                endpoint
            );

        }


        if (
            endpoint === '/api'
        ) {

            return API_BASE_URL;

        }


        if (
            endpoint.startsWith(
                '/'
            )
        ) {

            return (
                API_BASE_URL +
                endpoint
            );

        }


        return (
            API_BASE_URL +
            '/' +
            endpoint
        );

    }


    // =========================================================
    // HANDLE RESPONSE
    // =========================================================

    async function parseResponse(
        response
    ) {

        let data = null;


        try {

            data =
                await response.json();

        } catch (error) {

            data = null;

        }


        if (!response.ok) {

            const message =

                data?.message ||

                data?.error ||

                `HTTP ${response.status}: ${response.statusText}`;


            const apiError =
                new Error(
                    message
                );


            apiError.status =
                response.status;


            apiError.data =
                data;


            throw apiError;

        }


        return data;

    }


    // =========================================================
    // GENERIC REQUEST
    // =========================================================

    async function request(
        endpoint,
        options = {}
    ) {

        const {

            method = 'GET',

            body,

            headers = {},

            ...rest

        } = options;


        const config = {

            method,

            headers:
                buildHeaders(
                    headers
                ),

            ...rest

        };


        if (
            body !==
            undefined &&
            body !==
            null
        ) {

            config.body =

                typeof body ===
                    'string'

                    ? body

                    : JSON.stringify(
                        body
                    );

        }


        const url =
            buildUrl(
                endpoint
            );


        try {

            const response =
                await fetch(
                    url,
                    config
                );


            const data =
                await parseResponse(
                    response
                );


            return data;

        } catch (error) {

            console.error(

                `GoddyAPI request error [${method} ${url}]`,

                error

            );


            throw error;

        }

    }


    // =========================================================
    // HTTP HELPERS
    // =========================================================

    function get(
        endpoint,
        options = {}
    ) {

        return request(

            endpoint,

            {

                ...options,

                method:
                    'GET'

            }

        );

    }


    function post(
        endpoint,
        body = null,
        options = {}
    ) {

        return request(

            endpoint,

            {

                ...options,

                method:
                    'POST',

                body

            }

        );

    }


    function put(
        endpoint,
        body = null,
        options = {}
    ) {

        return request(

            endpoint,

            {

                ...options,

                method:
                    'PUT',

                body

            }

        );

    }


    function patch(
        endpoint,
        body = null,
        options = {}
    ) {

        return request(

            endpoint,

            {

                ...options,

                method:
                    'PATCH',

                body

            }

        );

    }


    function del(
        endpoint,
        options = {}
    ) {

        return request(

            endpoint,

            {

                ...options,

                method:
                    'DELETE'

            }

        );

    }


    // =========================================================
    // AUTH API
    // =========================================================

    const auth = {

        async login(
            username,
            password
        ) {

            if (!username) {

                throw new Error(
                    'Tên đăng nhập không được để trống.'
                );

            }


            if (!password) {

                throw new Error(
                    'Mật khẩu không được để trống.'
                );

            }


            const data =
                await post(
                    '/auth/login',
                    {
                        username,
                        password
                    }
                );


            if (
                data &&
                data.success &&
                data.token
            ) {

                setAuth(
                    data.token,
                    data.user ||
                    null
                );

            }


            return data;

        },


        logout() {

            clearAuth();

            return true;

        },


        getToken() {

            return getToken();

        },


        getCurrentUser() {

            return getUser();

        },


        isLoggedIn() {

            return Boolean(
                getToken()
            );

        }

    };


    // =========================================================
    // CLIENT API
    // =========================================================

    const clients = {

        list(
            params = {}
        ) {

            const query =
                new URLSearchParams(
                    params
                ).toString();


            const endpoint =
                query

                    ? `/clients?${query}`

                    : '/clients';


            return get(
                endpoint
            );

        },


        detail(
            clientId
        ) {

            if (!clientId) {

                throw new Error(
                    'clientId không hợp lệ.'
                );

            }


            return get(
                `/clients/${clientId}`
            );

        },


        create(
            data
        ) {

            return post(
                '/clients',
                data
            );

        },


        update(
            clientId,
            data
        ) {

            if (!clientId) {

                throw new Error(
                    'clientId không hợp lệ.'
                );

            }


            return put(
                `/clients/${clientId}`,
                data
            );

        },


        remove(
            clientId
        ) {

            if (!clientId) {

                throw new Error(
                    'clientId không hợp lệ.'
                );

            }


            return del(
                `/clients/${clientId}`
            );

        },


        portal(
            clientId
        ) {

            if (!clientId) {

                throw new Error(
                    'clientId không hợp lệ.'
                );

            }


            return get(
                `/clients/portal/${clientId}`
            );

        }

    };


    // =========================================================
    // GENERIC API NAMESPACE
    // =========================================================

    const GoddyAPI = {

        config: {

            baseUrl:
                API_BASE_URL,

            tokenKey:
                TOKEN_KEY,

            userKey:
                USER_KEY

        },


        request,

        get,

        post,

        put,

        patch,

        delete:
            del,


        auth,

        clients,


        storage: {

            getToken,

            getUser,

            setAuth,

            clearAuth

        }

    };


    // =========================================================
    // EXPORT GLOBAL
    // =========================================================

    window.GoddyAPI =
        GoddyAPI;


    // =========================================================
    // DEBUG
    // =========================================================

    console.log(
        'GoddyAPI đã được khởi tạo.',
        {

            baseUrl:
                API_BASE_URL,

            loggedIn:
                Boolean(
                    getToken()
                ),

            user:
                getUser()

        }
    );


})(window);