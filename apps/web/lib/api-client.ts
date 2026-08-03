const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, body.message ?? "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Multipart uploads can't go through apiFetch — it always forces
 * Content-Type: application/json, but FormData needs the browser to set its
 * own multipart boundary in Content-Type instead.
 */
export async function apiUpload<T>(path: string, body: FormData): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    body,
  });

  if (!response.ok) {
    const responseBody = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, responseBody.message ?? "Upload failed");
  }

  return response.json() as Promise<T>;
}
