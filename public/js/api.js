/**
 * GODDY RECRUIT - API Layer
 * FE-06 / FE-07
 *
 * Mục đích:
 * - Tập trung toàn bộ giao tiếp giữa Frontend và Backend API
 * - Tự động gắn token đăng nhập khi gọi API
 * - Chuẩn hóa xử lý response / error
 * - Cung cấp namespace GoddyAPI cho các module frontend
 */

(function (window) {
    'use strict';

    // =========================================================
    // CONFIG
    // =========================================================

    const API_BASE_URL = '/api';

    const TOKEN_KEY = 'goddy_token';
    const USER_KEY = 'goddy_user';


    // =========================================================
    // STORAGE
    // =========================================================

    function getToken() {
        return localStorage.getItem(TOKEN_KEY) || '';
    }


    function getUser() {
        const rawUser = localStorage.getItem(USER_KEY);

        if (!rawUser) {
            return null;
        }

        try {
            return JSON.parse(rawUser);
        } catch (error) {
            console.warn(
                'GoddyAPI: Không thể đọc goddy_user.',
                error
            );

            return null;
        }
    }


    function setAuth(token, user) {

        if (token) {
            localStorage.setItem(
                TOKEN_KEY,
                token
            );
        }

        if (user) {
            localStorage.setItem(
                USER_KEY,
                JSON.stringify(user)
            );
        }
    }


    function clearAuth() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }


    // =========================================================
    // BUILD REQUEST
    // =========================================================

    function buildHeaders(customHeaders = {}) {

        const headers = {
            'Content-Type': 'application/json',
            ...customHeaders
        };

        const token = getToken();

        if (token) {
            headers.Authorization =
                `Bearer ${token}`;
        }

        return headers;
    }


    // =========================================================
    // NORMALIZE URL
    // =========================================================

    function buildUrl(endpoint) {

        if (!endpoint) {
            return API_BASE_URL;
        }

        if (
            endpoint.startsWith('http://') ||
            endpoint.startsWith('https://')
        ) {
            return endpoint;
        }

        if (endpoint.startsWith('/api/')) {
            return endpoint;
        }

        if (endpoint.startsWith('/')) {
            return API_BASE_URL + endpoint;
        }

        return API_BASE_URL + '/' + endpoint;
    }


    // =========================================================
    // HANDLE RESPONSE
    // =========================================================

    async function parseResponse(response) {

        let data = null;

        try {
            data = await response.json();
        } catch (error) {

            // Backend không trả JSON
            data = null;
        }


        if (!response.ok) {

            const message =
                data?.message ||
                data?.error ||
                `HTTP ${response.status}: ${response.statusText}`;

            const apiError =
                new Error(message);

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
            headers: buildHeaders(headers),
            ...rest
        };


        if (body !== undefined && body !== null) {

            config.body =
                typeof body === 'string'
                    ? body
                    : JSON.stringify(body);
        }


        const url =
            buildUrl(endpoint);


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
                method: 'GET'
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
                method: 'POST',
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
                method: 'PUT',
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
                method: 'PATCH',
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
                method: 'DELETE'
            }
        );
    }


    // =========================================================
    // AUTH API
    // =========================================================

    const auth = {

        /**
         * POST /api/auth/login
         *
         * Backend hiện tại nhận:
         * {
         *   username,
         *   password
         * }
         */
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


            // Nếu backend trả token/user,
            // đồng bộ luôn vào localStorage.
            if (
                data &&
                data.success &&
                data.token
            ) {

                setAuth(
                    data.token,
                    data.user || null
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

        /**
         * GET /api/clients
         */
        list(params = {}) {

            const query =
                new URLSearchParams(
                    params
                ).toString();

            const endpoint =
                query
                    ? `/clients?${query}`
                    : '/clients';

            return get(endpoint);
        },


        /**
         * GET /api/clients/:id
         */
        detail(clientId) {

            if (!clientId) {
                throw new Error(
                    'clientId không hợp lệ.'
                );
            }

            return get(
                `/clients/${clientId}`
            );
        },


        /**
         * POST /api/clients
         */
        create(data) {

            return post(
                '/clients',
                data
            );
        },


        /**
         * PUT /api/clients/:id
         */
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


        /**
         * DELETE /api/clients/:id
         */
        remove(clientId) {

            if (!clientId) {
                throw new Error(
                    'clientId không hợp lệ.'
                );
            }

            return del(
                `/clients/${clientId}`
            );
        },


        /**
         * GET /api/clients/portal/:id
         */
        portal(clientId) {

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

        // Cấu hình
        config: {
            baseUrl: API_BASE_URL,
            tokenKey: TOKEN_KEY,
            userKey: USER_KEY
        },

        // HTTP
        request,
        get,
        post,
        put,
        patch,
        delete: del,

        // Authentication
        auth,

        // Clients
        clients,

        // Storage helpers
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
    // DEBUG / INITIALIZATION
    // =========================================================

    console.log(
        'GoddyAPI đã được khởi tạo.',
        {
            baseUrl: API_BASE_URL,
            loggedIn: Boolean(getToken()),
            user: getUser()
        }
    );

})(window);