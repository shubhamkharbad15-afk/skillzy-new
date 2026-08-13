// src/lib/api.js

// Build dynamic base URL for API calls to match current host (supports localhost and LAN IPs)
const BASE_URL = (() => {
    const { protocol, hostname } = window.location;
    // Prefer explicit env if provided via Vite/webpack, guarded to avoid parsing issues
    let envUrl;
    try {
        envUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || envUrl;
    } catch (_) {
        // ignore if not supported
    }
    if (!envUrl && typeof process !== 'undefined' && process.env && process.env.VITE_API_BASE_URL) {
        envUrl = process.env.VITE_API_BASE_URL;
    }
    if (envUrl) return envUrl.replace(/\/$/, '');
    const port = 8000; // FastAPI default in this project
    return `${protocol}//${hostname}:${port}`;
})();

const getAuthToken = () => {
    // Prefer sessionStorage for tab-scoped auth, but fall back to localStorage for manual sign-in
    const sessionToken = sessionStorage.getItem('authToken');
    if (sessionToken) return sessionToken;
    const localToken = localStorage.getItem('authToken');
    return localToken || null;
};

export const fetchWithAuth = async (endpoint, options = {}) => {
    const token = getAuthToken();
    const { redirectOn401 = false, headers: optHeaders, ...rest } = options;
    const headers = {
        'Content-Type': 'application/json',
        ...optHeaders,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...rest,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401) {
            if (redirectOn401) {
                sessionStorage.removeItem('authToken');
                localStorage.removeItem('authToken');
                window.location.href = '/login';
                return; // prevent further processing
            }
        }
        // Try to include server error details to aid debugging (e.g., schema validation errors)
        let details = '';
        try {
            const ct = response.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
                const data = await response.json();
                details = data && typeof data === 'object' ? JSON.stringify(data) : String(data);
            } else {
                details = await response.text();
            }
        } catch (_) {}
        const msg = `HTTP error! status: ${response.status}${details ? ` | ${details}` : ''}`;
        throw new Error(msg);
    }

    // Gracefully handle empty and non-JSON responses (e.g., 204 No Content after DELETE)
    if (response.status === 204) {
        return null;
    }
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return response.json();
    }
    // Fallback: try text for non-JSON
    const text = await response.text();
    try {
        return text ? JSON.parse(text) : null;
    } catch (_) {
        return text || null;
    }
};