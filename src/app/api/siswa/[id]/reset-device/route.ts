import { NextRequest } from "next/server"
import pool from "@/lib/db"
import { requireAuth, successResponse, errorResponse } from "@/lib/auth-helpers"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request)
    if (user.role !== "admin") return errorResponse("Forbidden", 403)

    const { id } = await params
    const conn = await pool.getConnection()

    const [result] = await conn.query(
      "UPDATE siswa SET device_id = NULL WHERE id = ?",
      [id]
    )

    conn.release()

    if ((result as { affectedRows: number }).affectedRows === 0) {
      return errorResponse("Siswa tidak ditemukan", 404)
    }

    return successResponse(null, "Device ID berhasil direset. Siswa dapat login di perangkat baru.")
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Unauthorized") return errorResponse("Unauthorized", 401)
      if (err.message === "Forbidden") return errorResponse("Forbidden", 403)
    }
    console.error("Reset device error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}
