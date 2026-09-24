/* =========================================
   FRONTEND API LAYER
   NGUYEN_HOANG_PHUOC
   ========================================= */

const API_BASE_URL = "/api";

async function apiRequest(endpoint, options = {}) {
    const config = {
        method: options.method || "GET",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    };

    if (options.body !== undefined) {
        config.body = JSON.stringify(options.body);
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        config
    );

    let data = null;

    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }

    if (!response.ok) {
        const message =
            data?.message ||
            `API request failed: ${response.status}`;

        throw new Error(message);
    }

    return data;
}

async function apiGet(endpoint) {
    return apiRequest(endpoint);
}

async function apiPost(endpoint, body) {
    return apiRequest(endpoint, {
        method: "POST",
        body
    });
}

async function apiPut(endpoint, body) {
    return apiRequest(endpoint, {
        method: "PUT",
        body
    });
}

async function apiDelete(endpoint) {
    return apiRequest(endpoint, {
        method: "DELETE"
    });
}