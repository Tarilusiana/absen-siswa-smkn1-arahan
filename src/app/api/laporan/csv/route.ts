import { NextRequest } from "next/server"
import pool from "@/lib/db"
import { requireAuth, errorResponse } from "@/lib/auth-helpers"

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
    } else if (idKelas && user.role === "admin") {
      classFilter = "AND s.id_kelas = ?"
      params.push(parseInt(idKelas))
    }

    const startDate = `${tahun}-${bulan.padStart(2, "0")}-01`
    const lastDay = new Date(parseInt(tahun), parseInt(bulan), 0).getDate()
    const endDate = `${tahun}-${bulan.padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

    const [rows] = await conn.query(
      `SELECT s.nisn, s.nama, k.nama as kelas,
              a.tanggal, a.status,
              COALESCE(a.jam_masuk, '-') as jam_masuk,
              COALESCE(a.jam_pulang, '-') as jam_pulang
       FROM siswa s
       JOIN kelas k ON s.id_kelas = k.id
       LEFT JOIN absensi a ON s.id = a.id_siswa AND a.tanggal BETWEEN ? AND ?
       WHERE 1=1 ${classFilter}
       ORDER BY k.nama, s.nama, a.tanggal`,
      [startDate, endDate, ...params]
    )

    conn.release()

    const header = "NISN,Nama,Kelas,Tanggal,Status,Jam Masuk,Jam Pulang\n"
    const csvData = (rows as unknown as Record<string, unknown>[])
    const csvRows = csvData.map(r =>
      `${r.nisn},"${r.nama}","${r.kelas}",${r.tanggal || "-"},${r.status || "-"},${r.jam_masuk},${r.jam_pulang}`
    ).join("\n")

    return new Response(header + csvRows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=laporan-kehadiran-${tahun}-${bulan}.csv`,
      },
    })
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Laporan CSV error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}
