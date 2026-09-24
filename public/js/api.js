/* =========================================================
   GODDY ERP - API LAYER
   FE-07: NGUYEN_HOANG_PHUOC
   ========================================================= */


/*
 * =========================================================
 * API CONFIGURATION
 * =========================================================
 *
 * Frontend chỉ gọi API thông qua file này.
 *
 * Không viết:
 *
 * http://localhost:xxxx/api/...
 *
 * trực tiếp trong từng màn hình.
 *
 * =========================================================
 */

const API_CONFIG = {

    baseUrl: "/api",

    timeout: 15000

};


/*
 * =========================================================
 * BUILD URL
 * =========================================================
 */

function buildApiUrl(endpoint) {

    const normalizedEndpoint =
        endpoint.startsWith("/")
            ? endpoint
            : `/${endpoint}`;

    return `${API_CONFIG.baseUrl}${normalizedEndpoint}`;

}


/*
 * =========================================================
 * REQUEST
 * =========================================================
 */

async function apiRequest(
    endpoint,
    options = {}
) {

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
                buildApiUrl(endpoint),
                {
                    ...options,

                    headers: {
                        "Content-Type":
                            "application/json",

                        ...(options.headers || {})
                    },

                    signal:
                        controller.signal
                }
            );


        clearTimeout(timeoutId);


        /*
         * Kiểm tra response.
         */

        if (!response.ok) {

            let errorMessage =
                `API Error: ${response.status}`;

            try {

                const errorData =
                    await response.json();

                if (
                    errorData &&
                    typeof errorData.message ===
                    "string"
                ) {

                    errorMessage =
                        errorData.message;

                }

            } catch (error) {

                /*
                 * Response không phải JSON.
                 */

            }


            throw new Error(
                errorMessage
            );

        }


        /*
         * Một số API trả về 204
         * và không có body.
         */

        if (
            response.status === 204
        ) {

            return null;

        }


        const contentType =
            response.headers.get(
                "content-type"
            );


        if (
            contentType &&
            contentType.includes(
                "application/json"
            )
        ) {

            return await response.json();

        }


        return await response.text();

    } catch (error) {

        clearTimeout(timeoutId);


        if (
            error instanceof DOMException &&
            error.name === "AbortError"
        ) {

            throw new Error(
                "Yêu cầu API đã hết thời gian chờ."
            );

        }


        throw error;

    }

}


/*
 * =========================================================
 * GET
 * =========================================================
 */

async function apiGet(
    endpoint,
    params = {}
) {

    const query =
        new URLSearchParams();


    Object.entries(params).forEach(
        function ([key, value]) {

            if (
                value !== null &&
                value !== undefined &&
                value !== ""
            ) {

                query.append(
                    key,
                    String(value)
                );

            }

        }
    );


    const queryString =
        query.toString();


    const url =
        queryString
            ? `${endpoint}?${queryString}`
            : endpoint;


    return await apiRequest(
        url,
        {
            method: "GET"
        }
    );

}


/*
 * =========================================================
 * POST
 * =========================================================
 */

async function apiPost(
    endpoint,
    data = {}
) {

    return await apiRequest(
        endpoint,
        {
            method: "POST",

            body:
                JSON.stringify(data)
        }
    );

}


/*
 * =========================================================
 * PUT
 * =========================================================
 */

async function apiPut(
    endpoint,
    data = {}
) {

    return await apiRequest(
        endpoint,
        {
            method: "PUT",

            body:
                JSON.stringify(data)
        }
    );

}


/*
 * =========================================================
 * DELETE
 * =========================================================
 */

async function apiDelete(
    endpoint
) {

    return await apiRequest(
        endpoint,
        {
            method: "DELETE"
        }
    );

}


/*
 * =========================================================
 * EXPORT TO GLOBAL WINDOW
 * =========================================================
 *
 * Giúp các file HTML/JS khác sử dụng được API layer.
 *
 * =========================================================
 */

window.GoddyAPI = {

    request: apiRequest,

    get: apiGet,

    post: apiPost,

    put: apiPut,

    delete: apiDelete

};