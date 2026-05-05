import { NextRequest } from "next/server"
import pool from "@/lib/db"
import { requireAuth, successResponse, errorResponse } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const idKelas = searchParams.get("id_kelas")

    const conn = await pool.getConnection()

    let query = `
      SELECT a.id, a.id_siswa, s.nisn, s.nama as nama_siswa,
             s.id_kelas, k.nama as nama_kelas,
             a.tanggal, a.jam_masuk, a.jam_pulang, a.status
      FROM absensi a
      JOIN siswa s ON a.id_siswa = s.id
      JOIN kelas k ON s.id_kelas = k.id
      WHERE a.tanggal = CURDATE()
    `
    const params: unknown[] = []

    if (user.role === "wali_kelas") {
      query += " AND s.id_kelas = ?"
      params.push(user.id_kelas)
    } else if (idKelas && user.role === "admin") {
      query += " AND s.id_kelas = ?"
      params.push(parseInt(idKelas))
    }

    query += " ORDER BY s.nama ASC"

    const [rows] = await conn.query(query, params)
    conn.release()

    return successResponse(rows)
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Absensi hari ini error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}
