import { NextRequest } from "next/server"
import pool from "@/lib/db"
import { requireAuth, successResponse, errorResponse } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const bulan = searchParams.get("bulan")
    const tahun = searchParams.get("tahun")
    const idKelas = searchParams.get("id_kelas")

    if (!bulan || !tahun) {
      return errorResponse("Bulan dan tahun wajib diisi", 400)
    }

    const conn = await pool.getConnection()

    let classFilter = ""
    const params: unknown[] = []

    if (user.role === "wali_kelas") {
      classFilter = "AND s.id_kelas = ?"
      params.push(user.id_kelas)
    } else if (idKelas && user.role === "admin" && idKelas !== "all") {
      classFilter = "AND s.id_kelas = ?"
      params.push(parseInt(idKelas))
    }

    const [siswaRows] = await conn.query(
      `SELECT s.id as siswa_id, s.nisn, s.nama
       FROM siswa s
       WHERE 1=1 ${classFilter}
       ORDER BY s.nama ASC`,
      params
    )

    const sArr = siswaRows as unknown as Record<string, unknown>[]
    if (sArr.length === 0) {
      conn.release()
      return successResponse([])
    }

    const siswaIds = sArr.map(s => s.siswa_id)

    const startDate = `${tahun}-${bulan.padStart(2, "0")}-01`
    const lastDay = new Date(parseInt(tahun), parseInt(bulan), 0).getDate()
    const endDate = `${tahun}-${bulan.padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

    const [absensiRows] = await conn.query(
      `SELECT id_siswa, tanggal, status
       FROM absensi
       WHERE id_siswa IN (${siswaIds.map(() => "?").join(",")})
         AND tanggal BETWEEN ? AND ?`,
      [...siswaIds, startDate, endDate]
    )

    const absensiMap: Record<number, Record<string, string>> = {}
    const aArr = absensiRows as unknown as Record<string, unknown>[]
    for (const row of aArr) {
      const sid = row.id_siswa as number
      if (!absensiMap[sid]) absensiMap[sid] = {}
      absensiMap[sid][row.tanggal as string] = row.status as string
    }

    conn.release()

    const result = sArr.map(s => ({
      siswa_id: s.siswa_id,
      nisn: s.nisn,
      nama: s.nama,
      status_per_tanggal: absensiMap[s.siswa_id as number] || {},
    }))

    return successResponse(result)
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Laporan matriks error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}
