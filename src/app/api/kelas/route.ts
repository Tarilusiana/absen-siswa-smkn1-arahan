import { NextRequest } from "next/server"
import pool from "@/lib/db"
import { requireAuth, successResponse, errorResponse } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  try {
    requireAuth(request)
    const conn = await pool.getConnection()
    const [rows] = await conn.query(
      "SELECT id, nama, tingkat, jurusan FROM kelas ORDER BY tingkat, jurusan, nama"
    )
    conn.release()
    return successResponse(rows)
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Kelas GET error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    if (user.role !== "admin") return errorResponse("Forbidden", 403)

    const body = await request.json()
    const { nama, tingkat, jurusan } = body

    if (!nama || !tingkat || !jurusan) {
      return errorResponse("Data tidak lengkap", 400)
    }

    const conn = await pool.getConnection()
    const [result] = await conn.query(
      "INSERT INTO kelas (nama, tingkat, jurusan) VALUES (?, ?, ?)",
      [nama, tingkat, jurusan]
    )

    const [rows] = await conn.query(
      "SELECT id, nama, tingkat, jurusan FROM kelas WHERE id = ?",
      [(result as { insertId: number }).insertId]
    )
    conn.release()

    return successResponse(Array.isArray(rows) ? rows[0] : null, "Kelas berhasil ditambahkan")
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Unauthorized") return errorResponse("Unauthorized", 401)
      if (err.message === "Forbidden") return errorResponse("Forbidden", 403)
      if ((err as { code?: string }).code === "ER_DUP_ENTRY") {
        return errorResponse("Nama kelas sudah ada", 409)
      }
    }
    console.error("Kelas POST error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}
