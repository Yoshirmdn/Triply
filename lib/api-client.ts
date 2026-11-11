import type { ApiResponse } from "@/@type/api";

const BASE_URL = "/api/v1";

export class ApiClientError extends Error {
  status: number;
  errors?: unknown;

  constructor(message: string, status: number, errors?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errors = errors;
  }
}

type RequestOptions = {
  body?: unknown;
  signal?: AbortSignal;
  guard?: boolean;
};

function guardHeader() {
  const username = process.env.NEXT_PUBLIC_AUTH_USERNAME ?? "";
  const password = process.env.NEXT_PUBLIC_AUTH_PASSWORD ?? "";
  return `Basic ${btoa(`${username}:${password}`)}`;
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.guard) headers.Authorization = guardHeader();

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
    signal: options.signal,
  });

  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!res.ok || !json?.success) {
    throw new ApiClientError(
      json?.message ?? `Request gagal (${res.status})`,
      res.status,
      json && !json.success ? json.errors : undefined,
    );
  }

  return json.data;
}

export function apiGet<T>(
  path: string,
  options?: Omit<RequestOptions, "body">,
) {
  return request<T>("GET", path, options);
}

export function apiPost<T>(
  path: string,
  body?: unknown,
  options?: Omit<RequestOptions, "body">,
) {
  return request<T>("POST", path, { ...options, body });
}

export function apiPatch<T>(
  path: string,
  body?: unknown,
  options?: Omit<RequestOptions, "body">,
) {
  return request<T>("PATCH", path, { ...options, body });
}

export function apiDelete<T = null>(
  path: string,
  options?: Omit<RequestOptions, "body">,
) {
  return request<T>("DELETE", path, options);
}
