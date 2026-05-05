const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api"

interface FetchOptions extends RequestInit {
  token?: string
}

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = "ApiError"
  }
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOpts } = options

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOpts,
    headers,
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: "Request failed" }))
    throw new ApiError(errorBody.message || "Request failed", res.status)
  }

  return res.json()
}

export const api = {
  get: <T>(endpoint: string, token?: string) =>
    fetchApi<T>(endpoint, { method: "GET", token }),

  post: <T>(endpoint: string, body: unknown, token?: string) =>
    fetchApi<T>(endpoint, { method: "POST", body: JSON.stringify(body), token }),

  put: <T>(endpoint: string, body: unknown, token?: string) =>
    fetchApi<T>(endpoint, { method: "PUT", body: JSON.stringify(body), token }),

  delete: <T>(endpoint: string, token?: string) =>
    fetchApi<T>(endpoint, { method: "DELETE", token }),

  upload: async <T>(endpoint: string, formData: FormData, token?: string): Promise<T> => {
    const headers: Record<string, string> = {}
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    })

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ message: "Upload failed" }))
      throw new ApiError(errorBody.message || "Upload failed", res.status)
    }

    return res.json()
  },
}

export { ApiError }
