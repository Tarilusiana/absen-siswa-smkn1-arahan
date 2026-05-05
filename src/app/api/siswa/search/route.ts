import { NextRequest } from "next/server"
import pool from "@/lib/db"
import { requireAuth, successResponse, errorResponse } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q") || ""
    const idKelas = searchParams.get("id_kelas")

    if (q.length < 2) {
      return errorResponse("Minimal 2 karakter untuk pencarian", 400)
    }

    const conn = await pool.getConnection()

    let query = `
      SELECT s.id, s.nisn, s.nama, s.id_kelas, k.nama as nama_kelas
      FROM siswa s
      JOIN kelas k ON s.id_kelas = k.id
      WHERE (s.nisn LIKE ? OR s.nama LIKE ?)
    `
    const params: unknown[] = [`%${q}%`, `%${q}%`]

    if (user.role === "wali_kelas") {
      query += " AND s.id_kelas = ?"
      params.push(user.id_kelas)
    } else if (idKelas) {
      query += " AND s.id_kelas = ?"
      params.push(parseInt(idKelas))
    }

    query += " ORDER BY s.nama LIMIT 20"

    const [rows] = await conn.query(query, params)
    conn.release()

    return successResponse(rows)
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Siswa search error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}
