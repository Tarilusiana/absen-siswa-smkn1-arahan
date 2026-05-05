import { NextRequest } from "next/server"
import pool from "@/lib/db"
import { signToken } from "@/lib/jwt"
import { successResponse, errorResponse } from "@/lib/auth-helpers"

export async function POST(request: NextRequest) {
  try {
    let body: { username?: string; password?: string }
    try {
      body = await request.json()
    } catch {
      return errorResponse("Format request tidak valid", 400)
    }
    const { username, password } = body

    if (!username || !password) {
      return errorResponse("Username dan password wajib diisi", 400)
    }

    const conn = await pool.getConnection()

    // Check admin table
    const [adminRows] = await conn.query(
      "SELECT id, username, nama FROM admin WHERE username = ? AND BINARY password = ?",
      [username, password]
    )

    const adminArr = adminRows as unknown as Record<string, unknown>[]
    if (adminArr.length > 0) {
      const admin = adminArr[0]
      conn.release()
      const payload = {
        id: admin.id as number,
        username: admin.username as string,
        role: "admin" as const,
        id_kelas: null,
      }
      const token = signToken(payload)
      return successResponse({
        id: admin.id,
        username: admin.username as string,
        nama: admin.nama as string,
        role: "admin",
        token,
      }, "Login berhasil")
    }

    // Check wali_kelas table
    const [wkRows] = await conn.query(
      "SELECT wk.id, wk.username, wk.nama, wk.id_kelas, k.nama as nama_kelas FROM wali_kelas wk JOIN kelas k ON wk.id_kelas = k.id WHERE wk.username = ? AND BINARY wk.password = ?",
      [username, password]
    )

    const wkArr = wkRows as unknown as Record<string, unknown>[]
    if (wkArr.length > 0) {
      const wk = wkArr[0]
      conn.release()
      const payload = {
        id: wk.id as number,
        username: wk.username as string,
        role: "wali_kelas" as const,
        id_kelas: wk.id_kelas as number,
      }
      const token = signToken(payload)
      return successResponse({
        id: wk.id,
        username: wk.username as string,
        nama: wk.nama as string,
        role: "wali_kelas",
        id_kelas: wk.id_kelas,
        token,
      }, "Login berhasil")
    }

    conn.release()
    return errorResponse("Username atau password salah", 401)
  } catch (err) {
    console.error("Login error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}
