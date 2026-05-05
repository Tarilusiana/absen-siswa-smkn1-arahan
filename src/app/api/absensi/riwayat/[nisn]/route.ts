import { NextRequest } from "next/server"
import pool from "@/lib/db"
import { requireAuth, successResponse, errorResponse } from "@/lib/auth-helpers"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nisn: string }> }
) {
  try {
    requireAuth(request)
    const { nisn } = await params

    const conn = await pool.getConnection()

    const [rows] = await conn.query(
      `SELECT a.id, a.tanggal, a.jam_masuk, a.jam_pulang, a.status, a.keterangan
       FROM absensi a
       JOIN siswa s ON a.id_siswa = s.id
       WHERE s.nisn = ?
       ORDER BY a.tanggal DESC
       LIMIT 60`,
      [nisn]
    )

    conn.release()

    return successResponse({ riwayat: rows })
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Riwayat error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}
