import { NextRequest } from "next/server"
import pool from "@/lib/db"
import { requireAuth, successResponse, errorResponse } from "@/lib/auth-helpers"

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    let body: { id_siswa?: number; tanggal?: string; status?: string; keterangan?: string }
    try {
      body = await request.json()
    } catch {
      return errorResponse("Format request tidak valid", 400)
    }
    const { id_siswa, tanggal, status, keterangan } = body

    if (!id_siswa || !tanggal || !status) {
      return errorResponse("Data tidak lengkap", 400)
    }

    // Validasi status
    const validStatus = ["H", "S", "I", "A", "T"]
    if (!validStatus.includes(status)) {
      return errorResponse("Status tidak valid", 400)
    }

    // Validasi max H-10
    const selected = new Date(tanggal)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const maxBackdate = new Date(today)
    maxBackdate.setDate(maxBackdate.getDate() - 10)

    if (selected > today || selected < maxBackdate) {
      return errorResponse("Tanggal di luar batas (maksimal H-10)", 400)
    }

    const conn = await pool.getConnection()

    // Check siswa exists
    const [siswaRows] = await conn.query(
      "SELECT id, id_kelas FROM siswa WHERE id = ?",
      [id_siswa]
    )

    const sArr = siswaRows as unknown as Record<string, unknown>[]
    if (sArr.length === 0) {
      conn.release()
      return errorResponse("Siswa tidak ditemukan", 404)
    }

    const siswa = sArr[0]

    // Wali kelas hanya bisa edit kelasnya
    if (user.role === "wali_kelas" && siswa.id_kelas !== user.id_kelas) {
      conn.release()
      return errorResponse("Anda hanya bisa mengedit siswa di kelas Anda", 403)
    }

    // Upsert absensi
    await conn.query(
      `INSERT INTO absensi (id_siswa, tanggal, status, keterangan, diubah_oleh, diubah_pada)
       VALUES (?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE status = VALUES(status), keterangan = VALUES(keterangan),
                               diubah_oleh = VALUES(diubah_oleh), diubah_pada = NOW()`,
      [id_siswa, tanggal, status, keterangan || null, user.username]
    )

    conn.release()
    return successResponse(null, "Data kehadiran berhasil disimpan")
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Absensi manual error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}
