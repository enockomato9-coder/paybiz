const API_ROOT = "/api";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function readCsrfCookie() {
  const cookie = document.cookie
    .split("; ")
    .find((value) => value.startsWith("csrftoken="));
  return cookie ? decodeURIComponent(cookie.slice("csrftoken=".length)) : "";
}

export async function ensureCsrfToken() {
  const response = await fetch(`${API_ROOT}/auth/csrf/`, {
    credentials: "same-origin",
  });
  if (!response.ok) {
    throw new ApiError("Could not initialize a secure sign-in session.", response.status);
  }
  return response.json();
}

export async function apiRequest(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});
  const requestOptions = {
    ...options,
    credentials: "same-origin",
    method,
    headers,
  };

  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    if (!readCsrfCookie()) await ensureCsrfToken();
    headers.set("X-CSRFToken", readCsrfCookie());
    if (options.body && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
  }

  const response = await fetch(`${API_ROOT}${path}`, requestOptions);
  if (response.status === 401) {
    window.dispatchEvent(new Event("paybiz:unauthorized"));
  }
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    if (!response.ok) {
      throw new ApiError("The server returned an unexpected response.", response.status);
    }
    throw new ApiError("The server returned data in an unsupported format.", response.status);
  }

  const payload = await response.json();
  if (!response.ok) {
    throw new ApiError(payload.error || "The request could not be completed.", response.status);
  }
  return payload;
}

export async function downloadTransactions(searchParams, signal) {
  const response = await fetch(
    `${API_ROOT}/transactions/export.csv?${searchParams}`,
    { credentials: "same-origin", signal },
  );

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new Event("paybiz:unauthorized"));
    }
    const payload = await response.json().catch(() => ({}));
    throw new ApiError(
      payload.error || "The transaction export could not be created.",
      response.status,
    );
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "paybiz-transactions.csv";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
