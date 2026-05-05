import { NextRequest } from "next/server"
import pool from "@/lib/db"
import { requireAuth, successResponse, errorResponse } from "@/lib/auth-helpers"

const SEKOLAH_LAT = -6.123456
const SEKOLAH_LNG = 107.654321
const RADIUS_METER = 500

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function getWIBTime(): string {
  const now = new Date()
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  return wib.toISOString().slice(11, 19)
}

function getWIBDate(): string {
  const now = new Date()
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  return wib.toISOString().slice(0, 10)
}

function getWIBHour(): number {
  const now = new Date()
  return (now.getUTCHours() + 7) % 24
}

function getWIBMinute(): number {
  return new Date().getUTCMinutes()
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    let body: { nisn?: string; latitude?: number; longitude?: number; jenis?: string }
    try {
      body = await request.json()
    } catch {
      return errorResponse("Format request tidak valid", 400)
    }
    const { nisn, latitude, longitude, jenis } = body

    if (!nisn || latitude == null || longitude == null || !jenis) {
      return errorResponse("Data absensi tidak lengkap", 400)
    }

    if (jenis !== "masuk" && jenis !== "pulang") {
      return errorResponse("Jenis absen tidak valid", 400)
    }

    // Validate geofencing
    const distance = haversineDistance(latitude, longitude, SEKOLAH_LAT, SEKOLAH_LNG)
    if (distance > RADIUS_METER) {
      return errorResponse(
        `Di luar radius sekolah (${Math.round(distance)}m). Maksimal ${RADIUS_METER}m.`,
        400
      )
    }

    const conn = await pool.getConnection()

    // Verify siswa
    const [siswaRows] = await conn.query(
      "SELECT id, nisn FROM siswa WHERE nisn = ?",
      [nisn]
    )
    const sArr = siswaRows as unknown as Record<string, unknown>[]
    if (sArr.length === 0) {
      conn.release()
      return errorResponse("Siswa tidak ditemukan", 404)
    }

    const idSiswa = sArr[0].id as number
    const today = getWIBDate()
    const currentHour = getWIBHour()
    const currentMinute = getWIBMinute()
    const currentTime = getWIBTime()

    if (jenis === "masuk") {
      // Validasi jam masuk: 06:00 - 09:00 WIB
      if (currentHour < 6 || (currentHour >= 9 && currentMinute > 0)) {
        conn.release()
        return errorResponse("Di luar jam absen masuk (06:00 - 09:00 WIB)", 400)
      }

      const status = (currentHour === 7 && currentMinute >= 30) || currentHour >= 8 ? "T" : "H"

      await conn.query(
        `INSERT INTO absensi (id_siswa, tanggal, jam_masuk, status)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           jam_masuk = CASE WHEN jam_masuk IS NULL THEN VALUES(jam_masuk) ELSE jam_masuk END,
           status = CASE WHEN status = 'A' THEN VALUES(status) ELSE status END`,
        [idSiswa, today, currentTime, status]
      )
    } else {
      // Absen pulang: 14:30 - 17:00 WIB
      if (currentHour < 14 || currentHour >= 17) {
        conn.release()
        return errorResponse("Di luar jam absen pulang (14:30 - 17:00 WIB)", 400)
      }
      if (currentHour === 14 && currentMinute < 30) {
        conn.release()
        return errorResponse("Absen pulang mulai pukul 14:30 WIB", 400)
      }

      // Check sudah absen masuk
      const [checkRows] = await conn.query(
        "SELECT id FROM absensi WHERE id_siswa = ? AND tanggal = ? AND jam_masuk IS NOT NULL",
        [idSiswa, today]
      )
      const cArr = checkRows as unknown as Record<string, unknown>[]
      if (cArr.length === 0) {
        conn.release()
        return errorResponse("Anda belum absen masuk hari ini", 400)
      }

      await conn.query(
        "UPDATE absensi SET jam_pulang = ? WHERE id_siswa = ? AND tanggal = ?",
        [currentTime, idSiswa, today]
      )
    }

    conn.release()
    return successResponse(null, jenis === "masuk" ? "Absen masuk berhasil" : "Absen pulang berhasil")
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Absen error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}
