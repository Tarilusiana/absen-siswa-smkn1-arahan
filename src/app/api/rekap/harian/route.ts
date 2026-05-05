import { NextRequest } from "next/server"
import pool from "@/lib/db"
import { requireAuth, successResponse, errorResponse } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const idKelas = searchParams.get("id_kelas")

    const conn = await pool.getConnection()

    let classFilter = ""
    const params: unknown[] = []

    if (user.role === "wali_kelas") {
      classFilter = "WHERE s.id_kelas = ?"
      params.push(user.id_kelas)
    } else if (idKelas && user.role === "admin") {
      classFilter = "WHERE s.id_kelas = ?"
      params.push(parseInt(idKelas))
    }

    const [totalRow] = await conn.query(
      `SELECT COUNT(*) as total FROM siswa s ${classFilter}`,
      params
    )

    const rows = totalRow as unknown as Record<string, number>[]
    const total = rows[0]?.total || 0

    const [statusRows] = await conn.query(
      `SELECT a.status, COUNT(*) as jumlah
       FROM absensi a
       JOIN siswa s ON a.id_siswa = s.id
       ${classFilter ? classFilter.replace("WHERE", "AND") : "WHERE"} a.tanggal = CURDATE()
       GROUP BY a.status`,
      params
    )

    const statusMap: Record<string, number> = { H: 0, S: 0, I: 0, A: 0, T: 0 }
    const sr = statusRows as unknown as Record<string, unknown>[]
    for (const row of sr) {
      statusMap[row.status as string] = (row.jumlah as number) || 0
    }

    conn.release()

    // Siswa yang belum absen = alpa
    const attended = statusMap.H + statusMap.S + statusMap.I + statusMap.T
    const alpa = total - attended

    return successResponse([{
      tanggal: new Date().toISOString().slice(0, 10),
      total,
      hadir: statusMap.H,
      sakit: statusMap.S,
      izin: statusMap.I,
      alpa: Math.max(0, alpa),
      terlambat: statusMap.T,
    }])
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Rekap harian error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}
