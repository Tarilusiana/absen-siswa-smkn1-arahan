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
    const { username, password, nama, id_kelas } = body

    if (!username || !nama || !id_kelas) {
      return errorResponse("Data tidak lengkap", 400)
    }

    const conn = await pool.getConnection()

    if (password) {
      await conn.query(
        "UPDATE wali_kelas SET username = ?, password = ?, nama = ?, id_kelas = ? WHERE id = ?",
        [username, password, nama, id_kelas, id]
      )
    } else {
      await conn.query(
        "UPDATE wali_kelas SET username = ?, nama = ?, id_kelas = ? WHERE id = ?",
        [username, nama, id_kelas, id]
      )
    }

    conn.release()
    return successResponse(null, "Wali kelas berhasil diperbarui")
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Unauthorized") return errorResponse("Unauthorized", 401)
      if (err.message === "Forbidden") return errorResponse("Forbidden", 403)
      if ((err as { code?: string }).code === "ER_DUP_ENTRY") {
        return errorResponse("Username atau id_kelas sudah terpakai", 409)
      }
    }
    console.error("Wali kelas PUT error:", err)
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
      "DELETE FROM wali_kelas WHERE id = ?",
      [id]
    )

    conn.release()

    if ((result as { affectedRows: number }).affectedRows === 0) {
      return errorResponse("Wali kelas tidak ditemukan", 404)
    }

    return successResponse(null, "Wali kelas berhasil dihapus")
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Unauthorized") return errorResponse("Unauthorized", 401)
      if (err.message === "Forbidden") return errorResponse("Forbidden", 403)
    }
    console.error("Wali kelas DELETE error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}
