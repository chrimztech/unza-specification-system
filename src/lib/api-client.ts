import { clearToken, getToken } from "@/lib/session";

const API_BASE_URL =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string> | undefined;

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  const isFormData = init.body instanceof FormData;
  if (!isFormData && init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "Could not reach the server. Check your connection and try again.");
  }

  if (res.status === 401) {
    clearToken();
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let fieldErrors: Record<string, string> | undefined;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
      if (body?.fieldErrors) fieldErrors = body.fieldErrors;
    } catch {
      // Non-JSON error body — keep the default message.
    }
    throw new ApiError(res.status, message, fieldErrors);
  }

  return res;
}

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return readJson<T>(await apiFetch(path, { method: "GET" }));
}

function jsonInit(method: string, body: unknown): RequestInit {
  return body !== undefined ? { method, body: JSON.stringify(body) } : { method };
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return readJson<T>(await apiFetch(path, jsonInit("POST", body)));
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return readJson<T>(await apiFetch(path, jsonInit("PUT", body)));
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return readJson<T>(await apiFetch(path, jsonInit("PATCH", body)));
}

export async function apiDelete<T = void>(path: string): Promise<T> {
  return readJson<T>(await apiFetch(path, { method: "DELETE" }));
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  return readJson<T>(await apiFetch(path, { method: "POST", body: formData }));
}

export async function apiDownload(path: string): Promise<{ blob: Blob; filename: string | null }> {
  const res = await apiFetch(path, { method: "GET" });
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = /filename="?([^";]+)"?/.exec(disposition);
  return { blob: await res.blob(), filename: match?.[1] ?? null };
}
