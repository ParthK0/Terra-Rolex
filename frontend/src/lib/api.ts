const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "/api" : "http://localhost:8000");

// Allow useAuth to register its logout handler so 401s trigger a clean logout
let _logoutCallback: (() => void) | null = null;

export function registerLogoutCallback(fn: () => void) {
  _logoutCallback = fn;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("terra_token");

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  // Auto-logout on token expiry / invalid token
  if (response.status === 401) {
    localStorage.removeItem("terra_token");
    localStorage.removeItem("terra_userId");
    if (_logoutCallback) {
      _logoutCallback();
    } else {
      // Fallback hard redirect if hook hasn't registered callback yet
      window.location.href = "/";
    }
  }

  return response;
}
