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
    const { nama, tingkat, jurusan } = body

    if (!nama || !tingkat || !jurusan) {
      return errorResponse("Data tidak lengkap", 400)
    }

    const conn = await pool.getConnection()
    const [result] = await conn.query(
      "UPDATE kelas SET nama = ?, tingkat = ?, jurusan = ? WHERE id = ?",
      [nama, tingkat, jurusan, id]
    )

    if ((result as { affectedRows: number }).affectedRows === 0) {
      conn.release()
      return errorResponse("Kelas tidak ditemukan", 404)
    }

    conn.release()
    return successResponse(null, "Kelas berhasil diperbarui")
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Unauthorized") return errorResponse("Unauthorized", 401)
      if (err.message === "Forbidden") return errorResponse("Forbidden", 403)
      if ((err as { code?: string }).code === "ER_DUP_ENTRY") {
        return errorResponse("Nama kelas sudah ada", 409)
      }
    }
    console.error("Kelas PUT error:", err)
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
      "DELETE FROM kelas WHERE id = ?",
      [id]
    )

    conn.release()

    if ((result as { affectedRows: number }).affectedRows === 0) {
      return errorResponse("Kelas tidak ditemukan", 404)
    }

    return successResponse(null, "Kelas berhasil dihapus")
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Unauthorized") return errorResponse("Unauthorized", 401)
      if (err.message === "Forbidden") return errorResponse("Forbidden", 403)
      if ((err as { code?: string }).code === "ER_ROW_IS_REFERENCED_2") {
        return errorResponse("Kelas tidak bisa dihapus karena masih memiliki siswa", 409)
      }
    }
    console.error("Kelas DELETE error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}
