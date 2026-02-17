/**
 * API utility functions with automatic authentication header injection
 */

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("tripsync_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const headers = getAuthHeaders();

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function apiGet<T = any>(url: string): Promise<T> {
  return apiRequest<T>(url, { method: "GET" });
}

export async function apiPost<T = any>(url: string, data?: any): Promise<T> {
  return apiRequest<T>(url, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiPatch<T = any>(url: string, data?: any): Promise<T> {
  return apiRequest<T>(url, {
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiPut<T = any>(url: string, data?: any): Promise<T> {
  return apiRequest<T>(url, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiDelete<T = any>(url: string): Promise<T> {
  return apiRequest<T>(url, { method: "DELETE" });
}
