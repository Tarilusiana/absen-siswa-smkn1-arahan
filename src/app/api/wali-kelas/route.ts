import { NextRequest } from "next/server"
import pool from "@/lib/db"
import { requireAuth, successResponse, errorResponse } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    if (user.role !== "admin") return errorResponse("Forbidden", 403)

    const conn = await pool.getConnection()
    const [rows] = await conn.query(
      `SELECT wk.id, wk.username, wk.nama, wk.id_kelas, k.nama as nama_kelas
       FROM wali_kelas wk
       JOIN kelas k ON wk.id_kelas = k.id
       ORDER BY k.nama`
    )
    conn.release()

    return successResponse(rows)
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Unauthorized") return errorResponse("Unauthorized", 401)
      if (err.message === "Forbidden") return errorResponse("Forbidden", 403)
    }
    console.error("Wali kelas GET error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    if (user.role !== "admin") return errorResponse("Forbidden", 403)

    const body = await request.json()
    const { username, password, nama, id_kelas } = body

    if (!username || !password || !nama || !id_kelas) {
      return errorResponse("Data tidak lengkap", 400)
    }

    const conn = await pool.getConnection()
    const [result] = await conn.query(
      "INSERT INTO wali_kelas (username, password, nama, id_kelas) VALUES (?, ?, ?, ?)",
      [username, password, nama, id_kelas]
    )

    const [rows] = await conn.query(
      `SELECT wk.id, wk.username, wk.nama, wk.id_kelas, k.nama as nama_kelas
       FROM wali_kelas wk JOIN kelas k ON wk.id_kelas = k.id
       WHERE wk.id = ?`,
      [(result as { insertId: number }).insertId]
    )
    conn.release()

    return successResponse(Array.isArray(rows) ? rows[0] : null, "Wali kelas berhasil ditambahkan")
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Unauthorized") return errorResponse("Unauthorized", 401)
      if (err.message === "Forbidden") return errorResponse("Forbidden", 403)
      if ((err as { code?: string }).code === "ER_DUP_ENTRY") {
        return errorResponse("Username atau id_kelas sudah terpakai", 409)
      }
    }
    console.error("Wali kelas POST error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}
