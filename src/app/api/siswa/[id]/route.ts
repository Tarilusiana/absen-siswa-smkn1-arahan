import { NextRequest } from "next/server"
import pool from "@/lib/db"
import { requireAuth, successResponse, errorResponse } from "@/lib/auth-helpers"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request)
    if (user.role !== "admin") return errorResponse("Forbidden", 403)

    const { id } = await params
    const body = await request.json()
    const { nisn, nama, id_kelas } = body

    if (!nisn || !nama || !id_kelas) {
      return errorResponse("Data tidak lengkap", 400)
    }

    const conn = await pool.getConnection()
    const [result] = await conn.query(
      "UPDATE siswa SET nisn = ?, nama = ?, id_kelas = ? WHERE id = ?",
      [nisn, nama, id_kelas, id]
    )

    if ((result as { affectedRows: number }).affectedRows === 0) {
      conn.release()
      return errorResponse("Siswa tidak ditemukan", 404)
    }

    conn.release()
    return successResponse(null, "Siswa berhasil diperbarui")
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Unauthorized") return errorResponse("Unauthorized", 401)
      if (err.message === "Forbidden") return errorResponse("Forbidden", 403)
      if ((err as { code?: string }).code === "ER_DUP_ENTRY") {
        return errorResponse("NISN sudah terdaftar", 409)
      }
    }
    console.error("Siswa PUT error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request)
    if (user.role !== "admin") return errorResponse("Forbidden", 403)

    const { id } = await params
    const conn = await pool.getConnection()

    const [result] = await conn.query(
      "DELETE FROM siswa WHERE id = ?",
      [id]
    )

    conn.release()

    if ((result as { affectedRows: number }).affectedRows === 0) {
      return errorResponse("Siswa tidak ditemukan", 404)
    }

    return successResponse(null, "Siswa berhasil dihapus")
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Unauthorized") return errorResponse("Unauthorized", 401)
      if (err.message === "Forbidden") return errorResponse("Forbidden", 403)
    }
    console.error("Siswa DELETE error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}
