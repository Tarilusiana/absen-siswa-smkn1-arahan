import jwt from "jsonwebtoken"

const SECRET = process.env.JWT_SECRET || "default-secret-change-me"

export interface TokenPayload {
  id: number
  username: string
  role: "admin" | "wali_kelas" | "siswa"
  id_kelas?: number | null
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as TokenPayload
  } catch {
    return null
  }
}
