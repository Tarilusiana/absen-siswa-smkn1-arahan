import { NextRequest } from "next/server"
import pool from "@/lib/db"
import { signToken } from "@/lib/jwt"
import { successResponse, errorResponse } from "@/lib/auth-helpers"

export async function POST(request: NextRequest) {
  try {
    let body: { nisn?: string; password?: string; device_id?: string }
    try {
      body = await request.json()
    } catch {
      return errorResponse("Format request tidak valid", 400)
    }
    const { nisn, password, device_id } = body

    if (!nisn || !password) {
      return errorResponse("NISN dan password wajib diisi", 400)
    }

    if (!device_id) {
      return errorResponse("Device ID tidak terdeteksi", 400)
    }

    const conn = await pool.getConnection()

    const [rows] = await conn.query(
      `SELECT s.id, s.nisn, s.nama, s.id_kelas, k.nama as nama_kelas, s.device_id
       FROM siswa s
       JOIN kelas k ON s.id_kelas = k.id
       WHERE s.nisn = ? AND s.password = ?`,
      [nisn, password]
    )

    const siswaArr = rows as unknown as Record<string, unknown>[]

    if (siswaArr.length === 0) {
      conn.release()
      return errorResponse("NISN atau password salah", 401)
    }

    const siswa = siswaArr[0]

    // Device binding check
    if (siswa.device_id && siswa.device_id !== device_id) {
      conn.release()
      return errorResponse(
        "Akun ini sudah terikat di perangkat lain. Hubungi Admin untuk reset device.",
        403
      )
    }

    // Bind device if first time
    if (!siswa.device_id) {
      await conn.query(
        "UPDATE siswa SET device_id = ? WHERE id = ?",
        [device_id, siswa.id]
      )
    }

    conn.release()

    const token = signToken({
      id: siswa.id as number,
      username: siswa.nisn as string,
      role: "siswa",
      id_kelas: siswa.id_kelas as number,
    })

    return successResponse({
      id: siswa.id,
      nisn: siswa.nisn,
      nama: siswa.nama,
      id_kelas: siswa.id_kelas,
      nama_kelas: siswa.nama_kelas,
      token,
    }, "Login berhasil")
  } catch (err) {
    console.error("Login siswa error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}
