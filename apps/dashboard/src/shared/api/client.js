const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');

function createUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

const AUTH_STORAGE_KEY = 'hall_booking_auth';

export async function apiFetch(path, options = {}) {
  const { method = 'GET', headers = {}, body, rawBody, skipJson } = options;

  let token = options.token;
  if (!token) {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        token = parsed.token;
      }
    } catch (e) {
      // Ignore
    }
  }

  const fetchHeaders = {
    ...(skipJson ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers
  };

  const fetchBody = rawBody ? rawBody : (body ? JSON.stringify(body) : undefined);

  const response = await fetch(createUrl(path), {
    method,
    headers: fetchHeaders,
    body: fetchBody
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiError = data?.error || {};
    const error = new Error(apiError.message || data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.code = apiError.code;
    error.details = apiError.details || {};
    error.data = data;
    throw error;
  }

  return data;
}

export const client = {
  get: (path, options = {}) => {
    const { params, ...rest } = options;
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(path + queryString, { method: 'GET', ...rest });
  },
  post: (path, data, options = {}) => {
    return apiFetch(path, { method: 'POST', body: data, ...options });
  },
  patch: (path, data, options = {}) => {
    return apiFetch(path, { method: 'PATCH', body: data, ...options });
  },
  delete: (path, options = {}) => {
    return apiFetch(path, { method: 'DELETE', ...options });
  },
  upload: (path, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch(path, { method: 'POST', rawBody: formData, skipJson: true });
  }
};

export { API_BASE_URL };
