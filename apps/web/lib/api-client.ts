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

  // Some endpoints return an empty body on 200/201 rather than 204 (e.g. a
  // void-returning POST without an explicit @HttpCode) — response.json()
  // throws on an empty string, so check for actual content first rather
  // than special-casing 204 alone.
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/**
 * Multipart uploads can't go through apiFetch — it always forces
 * Content-Type: application/json, but FormData needs the browser to set its
 * own multipart boundary in Content-Type instead.
 *
 * Uses XMLHttpRequest instead of fetch so upload progress (onProgress) is
 * observable — fetch has no upload-progress event.
 */
export function apiUpload<T>(
  path: string,
  body: FormData,
  onProgress?: (percent: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}${path}`);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let responseBody: unknown;
      try {
        responseBody = xhr.responseText ? JSON.parse(xhr.responseText) : undefined;
      } catch {
        responseBody = undefined;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(responseBody as T);
      } else {
        const message =
          (responseBody as { message?: string } | undefined)?.message ?? xhr.statusText ?? "Upload failed";
        reject(new ApiError(xhr.status, message));
      }
    };

    xhr.onerror = () => reject(new ApiError(0, "Network error during upload"));

    xhr.send(body);
  });
}
