import { NextRequest } from "next/server"
import pool from "@/lib/db"
import { requireAuth, successResponse, errorResponse } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)

    let query = `
      SELECT s.id, s.nisn, s.nama, s.id_kelas, k.nama as nama_kelas, s.device_id
      FROM siswa s
      JOIN kelas k ON s.id_kelas = k.id
    `
    const params: unknown[] = []

    if (user.role === "wali_kelas") {
      query += " WHERE s.id_kelas = ?"
      params.push(user.id_kelas)
    }

    query += " ORDER BY k.nama, s.nama"

    const conn = await pool.getConnection()
    const [rows] = await conn.query(query, params)
    conn.release()

    return successResponse(rows)
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Siswa GET error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    if (user.role !== "admin") return errorResponse("Forbidden", 403)

    const body = await request.json()
    const { nisn, nama, id_kelas } = body

    if (!nisn || !nama || !id_kelas) {
      return errorResponse("Data tidak lengkap", 400)
    }

    const conn = await pool.getConnection()
    const [result] = await conn.query(
      "INSERT INTO siswa (nisn, nama, id_kelas) VALUES (?, ?, ?)",
      [nisn, nama, id_kelas]
    )

    const [rows] = await conn.query(
      "SELECT s.id, s.nisn, s.nama, s.id_kelas, k.nama as nama_kelas FROM siswa s JOIN kelas k ON s.id_kelas = k.id WHERE s.id = ?",
      [(result as { insertId: number }).insertId]
    )
    conn.release()

    return successResponse(Array.isArray(rows) ? rows[0] : null, "Siswa berhasil ditambahkan")
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Unauthorized") return errorResponse("Unauthorized", 401)
      if (err.message === "Forbidden") return errorResponse("Forbidden", 403)
      if ((err as { code?: string }).code === "ER_DUP_ENTRY") {
        return errorResponse("NISN sudah terdaftar", 409)
      }
    }
    console.error("Siswa POST error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}
