/**
 * =========================================================
 * GODDY ERP - Frontend API Layer
 * FE-06
 * NGUYEN_HOANG_PHUOC
 * =========================================================
 *
 * Mục đích:
 * - Tập trung xử lý HTTP request tới Backend.
 * - Tự động quản lý JWT token.
 * - Chuẩn hóa URL, headers, body và response.
 * - Chuẩn hóa lỗi API.
 * - Hỗ trợ JSON và FormData.
 * - Cho phép các module frontend sử dụng API chung.
 *
 * Lưu ý:
 * - Không thay thế logic API hiện tại của các module.
 * - Không tự ý khai báo endpoint chưa được backend xác nhận.
 * - Việc chuyển từng module sang GoddyAPI sẽ thực hiện
 *   ở các FE task tương ứng.
 * =========================================================
 */

(function (window) {
    'use strict';


    // =====================================================
    // 1. CONFIG
    // =====================================================

    const API_CONFIG = {
        baseUrl: '/api',
        timeout: 15000,
        defaultHeaders: {
            Accept: 'application/json'
        }
    };


    // =====================================================
    // 2. AUTH STORAGE
    // =====================================================

    function getToken() {
        try {
            return localStorage.getItem('goddy_token') || null;
        } catch (error) {
            console.warn(
                '[GoddyAPI] Không thể đọc goddy_token:',
                error
            );

            return null;
        }
    }


    function setToken(token) {
        try {
            if (token) {
                localStorage.setItem(
                    'goddy_token',
                    token
                );
            } else {
                localStorage.removeItem(
                    'goddy_token'
                );
            }
        } catch (error) {
            console.warn(
                '[GoddyAPI] Không thể lưu goddy_token:',
                error
            );
        }
    }


    function clearToken() {
        try {
            localStorage.removeItem(
                'goddy_token'
            );
        } catch (error) {
            console.warn(
                '[GoddyAPI] Không thể xóa goddy_token:',
                error
            );
        }
    }


    function getCurrentUser() {
        try {
            const rawUser =
                localStorage.getItem('goddy_user');

            if (!rawUser) {
                return null;
            }

            return JSON.parse(rawUser);

        } catch (error) {
            console.warn(
                '[GoddyAPI] Không thể đọc goddy_user:',
                error
            );

            return null;
        }
    }


    function setCurrentUser(user) {
        try {
            if (user) {
                localStorage.setItem(
                    'goddy_user',
                    JSON.stringify(user)
                );
            } else {
                localStorage.removeItem(
                    'goddy_user'
                );
            }

        } catch (error) {
            console.warn(
                '[GoddyAPI] Không thể lưu goddy_user:',
                error
            );
        }
    }


    function clearCurrentUser() {
        try {
            localStorage.removeItem(
                'goddy_user'
            );
        } catch (error) {
            console.warn(
                '[GoddyAPI] Không thể xóa goddy_user:',
                error
            );
        }
    }


    function clearAuth() {
        clearToken();
        clearCurrentUser();
    }


    function isAuthenticated() {
        return !!getToken();
    }


    // =====================================================
    // 3. URL BUILDER
    // =====================================================

    function buildUrl(
        endpoint,
        queryParams
    ) {
        let cleanEndpoint =
            endpoint || '';


        // Đảm bảo endpoint bắt đầu bằng /
        if (!cleanEndpoint.startsWith('/')) {
            cleanEndpoint =
                '/' + cleanEndpoint;
        }


        let url =
            API_CONFIG.baseUrl +
            cleanEndpoint;


        // Query string
        if (
            queryParams &&
            typeof queryParams === 'object'
        ) {
            const searchParams =
                new URLSearchParams();


            Object.keys(queryParams).forEach(
                function (key) {
                    const value =
                        queryParams[key];


                    if (
                        value !== undefined &&
                        value !== null &&
                        value !== ''
                    ) {
                        searchParams.append(
                            key,
                            String(value)
                        );
                    }
                }
            );


            const queryString =
                searchParams.toString();


            if (queryString) {
                url += '?' + queryString;
            }
        }


        return url;
    }


    // =====================================================
    // 4. HEADERS
    // =====================================================

    function buildHeaders(
        body,
        customHeaders
    ) {
        const headers = {
            ...API_CONFIG.defaultHeaders,
            ...(customHeaders || {})
        };


        const token =
            getToken();


        if (token) {
            headers.Authorization =
                'Bearer ' + token;
        }


        /*
         * Không set Content-Type cho FormData.
         * Browser tự tạo multipart boundary.
         */
        if (
            !(body instanceof FormData) &&
            !headers['Content-Type']
        ) {
            headers['Content-Type'] =
                'application/json';
        }


        return headers;
    }


    // =====================================================
    // 5. BODY PREPARATION
    // =====================================================

    function prepareBody(body) {
        if (
            body === undefined ||
            body === null
        ) {
            return undefined;
        }


        // FormData
        if (body instanceof FormData) {
            return body;
        }


        // Blob
        if (body instanceof Blob) {
            return body;
        }


        // String
        if (typeof body === 'string') {
            return body;
        }


        // Object / Array
        return JSON.stringify(body);
    }


    // =====================================================
    // 6. RESPONSE PARSER
    // =====================================================

    async function parseResponse(
        response
    ) {
        const contentType =
            response.headers.get(
                'content-type'
            ) || '';


        if (
            contentType.includes(
                'application/json'
            )
        ) {
            try {
                return await response.json();
            } catch (error) {
                return null;
            }
        }


        try {
            return await response.text();
        } catch (error) {
            return null;
        }
    }


    // =====================================================
    // 7. API ERROR
    // =====================================================

    function createApiError(
        message,
        status,
        data
    ) {
        const error =
            new Error(
                message ||
                'API request failed'
            );


        error.status =
            status || 0;


        error.data =
            data || null;


        return error;
    }


    // =====================================================
    // 8. CORE REQUEST
    // =====================================================

    async function apiRequest(
        endpoint,
        options
    ) {
        const requestOptions =
            options || {};


        const method =
            requestOptions.method ||
            'GET';


        const body =
            prepareBody(
                requestOptions.body
            );


        const headers =
            buildHeaders(
                requestOptions.body,
                requestOptions.headers
            );


        const url =
            buildUrl(
                endpoint,
                requestOptions.query
            );


        const controller =
            new AbortController();


        const timeoutId =
            setTimeout(
                function () {
                    controller.abort();
                },
                API_CONFIG.timeout
            );


        try {
            const response =
                await fetch(
                    url,
                    {
                        method: method,
                        headers: headers,
                        body: body,
                        signal:
                            controller.signal,
                        credentials:
                            'same-origin'
                    }
                );


            clearTimeout(timeoutId);


            const data =
                await parseResponse(
                    response
                );


            // ---------------------------------------------
            // Unauthorized
            // ---------------------------------------------

            if (
                response.status === 401
            ) {
                clearAuth();


                throw createApiError(
                    'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.',
                    401,
                    data
                );
            }


            // ---------------------------------------------
            // HTTP error
            // ---------------------------------------------

            if (!response.ok) {
                let message =
                    'API request thất bại.';


                if (
                    data &&
                    typeof data === 'object'
                ) {
                    message =
                        data.message ||
                        data.error ||
                        message;
                }


                throw createApiError(
                    message,
                    response.status,
                    data
                );
            }


            // ---------------------------------------------
            // Success
            // ---------------------------------------------

            return data;

        } catch (error) {

            clearTimeout(timeoutId);


            // Timeout
            if (
                error &&
                error.name ===
                'AbortError'
            ) {
                throw createApiError(
                    'Kết nối tới máy chủ quá thời gian chờ.',
                    408,
                    null
                );
            }


            // Network error
            if (
                error &&
                error instanceof TypeError
            ) {
                throw createApiError(
                    'Không thể kết nối tới Backend API.',
                    0,
                    null
                );
            }


            // API error
            throw error;
        }
    }


    // =====================================================
    // 9. HTTP METHODS
    // =====================================================

    function apiGet(
        endpoint,
        query
    ) {
        return apiRequest(
            endpoint,
            {
                method: 'GET',
                query: query
            }
        );
    }


    function apiPost(
        endpoint,
        body
    ) {
        return apiRequest(
            endpoint,
            {
                method: 'POST',
                body: body
            }
        );
    }


    function apiPut(
        endpoint,
        body
    ) {
        return apiRequest(
            endpoint,
            {
                method: 'PUT',
                body: body
            }
        );
    }


    function apiPatch(
        endpoint,
        body
    ) {
        return apiRequest(
            endpoint,
            {
                method: 'PATCH',
                body: body
            }
        );
    }


    function apiDelete(
        endpoint
    ) {
        return apiRequest(
            endpoint,
            {
                method: 'DELETE'
            }
        );
    }


    // =====================================================
    // 10. AUTH API
    // =====================================================
    /*
     * Endpoint này đã được frontend hiện tại sử dụng:
     * POST /api/auth/login
     *
     * Tuy nhiên FE-06 chưa thay submitLogin() hiện tại.
     * FE-07 mới chuyển login sang GoddyAPI.login().
     */

    async function login(
        username,
        password
    ) {
        const response =
            await apiPost(
                '/auth/login',
                {
                    username:
                        username,
                    password:
                        password
                }
            );


        if (
            response &&
            response.token
        ) {
            setToken(
                response.token
            );
        }


        if (
            response &&
            response.user
        ) {
            setCurrentUser(
                response.user
            );
        }


        return response;
    }


    function logout() {
        clearAuth();

        return true;
    }


    // =====================================================
    // 11. CLIENT API
    // =====================================================
    /*
     * /api/clients đã được module clients.js hiện tại sử dụng.
     */

    function getClients(
        query
    ) {
        return apiGet(
            '/clients',
            query
        );
    }


    function getClient(
        clientId
    ) {
        return apiGet(
            '/clients/' +
            encodeURIComponent(
                clientId
            )
        );
    }


    function createClient(
        clientData
    ) {
        return apiPost(
            '/clients',
            clientData
        );
    }


    function updateClient(
        clientId,
        clientData
    ) {
        return apiPut(
            '/clients/' +
            encodeURIComponent(
                clientId
            ),
            clientData
        );
    }


    function deleteClient(
        clientId
    ) {
        return apiDelete(
            '/clients/' +
            encodeURIComponent(
                clientId
            )
        );
    }


    function getClientPortalData(
        clientId
    ) {
        return apiGet(
            '/clients/portal/' +
            encodeURIComponent(
                clientId
            )
        );
    }


    // =====================================================
    // 12. GENERIC API
    // =====================================================

    function get(
        endpoint,
        query
    ) {
        return apiGet(
            endpoint,
            query
        );
    }


    function post(
        endpoint,
        body
    ) {
        return apiPost(
            endpoint,
            body
        );
    }


    function put(
        endpoint,
        body
    ) {
        return apiPut(
            endpoint,
            body
        );
    }


    function patch(
        endpoint,
        body
    ) {
        return apiPatch(
            endpoint,
            body
        );
    }


    function remove(
        endpoint
    ) {
        return apiDelete(
            endpoint
        );
    }


    // =====================================================
    // 13. PUBLIC OBJECT
    // =====================================================

    const GoddyAPI = {

        // Config
        config:
            API_CONFIG,


        // Auth storage
        getToken:
            getToken,

        setToken:
            setToken,

        clearToken:
            clearToken,


        getCurrentUser:
            getCurrentUser,

        setCurrentUser:
            setCurrentUser,

        clearCurrentUser:
            clearCurrentUser,


        clearAuth:
            clearAuth,

        isAuthenticated:
            isAuthenticated,


        // Core
        request:
            apiRequest,


        // HTTP
        get:
            apiGet,

        post:
            apiPost,

        put:
            apiPut,

        patch:
            apiPatch,

        delete:
            apiDelete,


        // Authentication
        login:
            login,

        logout:
            logout,


        // Client
        clients: {
            list:
                getClients,

            get:
                getClient,

            create:
                createClient,

            update:
                updateClient,

            delete:
                deleteClient,

            portal:
                getClientPortalData
        }
    };


    // =====================================================
    // 14. GLOBAL EXPORT
    // =====================================================

    window.GoddyAPI =
        GoddyAPI;


    /*
     * Backward-compatible global methods.
     *
     * Các module cũ chưa dùng ngay,
     * nhưng FE sau có thể dùng:
     *
     * apiGet(...)
     * apiPost(...)
     * apiPut(...)
     * apiPatch(...)
     * apiDelete(...)
     */

    window.apiRequest =
        apiRequest;

    window.apiGet =
        apiGet;

    window.apiPost =
        apiPost;

    window.apiPut =
        apiPut;

    window.apiPatch =
        apiPatch;

    window.apiDelete =
        apiDelete;


    // =====================================================
    // 15. INITIALIZATION LOG
    // =====================================================

    console.log(
        '[GoddyAPI] API Layer đã khởi tạo.',
        'Base URL:',
        API_CONFIG.baseUrl
    );

})(window);