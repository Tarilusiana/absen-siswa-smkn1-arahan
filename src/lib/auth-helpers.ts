import { verifyToken, type TokenPayload } from "@/lib/jwt"

export interface AuthRequest extends Request {
  user?: TokenPayload
}

export function getUserId(request: Request): number {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return 0

  const token = authHeader.slice(7)
  const payload = verifyToken(token)
  return payload?.id ?? 0
}

export function getUserPayload(request: Request): TokenPayload | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null

  const token = authHeader.slice(7)
  return verifyToken(token)
}

export function requireAuth(request: Request): TokenPayload {
  const payload = getUserPayload(request)
  if (!payload) {
    throw new Error("Unauthorized")
  }
  return payload
}

export function requireAdmin(request: Request): TokenPayload {
  const payload = requireAuth(request)
  if (payload.role !== "admin") {
    throw new Error("Forbidden: Admin access required")
  }
  return payload
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ success: false, message }, status)
}

export function successResponse<T>(data?: T, message = "Success"): Response {
  return jsonResponse({ success: true, message, data })
}
