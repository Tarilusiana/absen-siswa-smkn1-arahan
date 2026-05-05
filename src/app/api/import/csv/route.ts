import { NextRequest } from "next/server"
import pool from "@/lib/db"
import { requireAuth, successResponse, errorResponse } from "@/lib/auth-helpers"

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    if (user.role !== "admin") return errorResponse("Forbidden", 403)

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const tipe = formData.get("tipe") as string

    if (!file || !tipe) {
      return errorResponse("File dan tipe data wajib diisi", 400)
    }

    if (!file.name.endsWith(".csv")) {
      return errorResponse("File harus berformat CSV", 400)
    }

    const content = await file.text()
    const lines = content.trim().split("\n")

    if (lines.length < 2) {
      return errorResponse("File CSV kosong atau hanya berisi header", 400)
    }

    const header = lines[0].split(",").map(h => h.trim().toLowerCase())
    const conn = await pool.getConnection()
    let imported = 0
    const errors: string[] = []

    try {
      switch (tipe) {
        case "siswa": {
          if (!header.includes("nisn") || !header.includes("nama") || !header.includes("id_kelas")) {
            return errorResponse("Format CSV siswa: nisn,nama,id_kelas", 400)
          }
          const nisnIdx = header.indexOf("nisn")
          const namaIdx = header.indexOf("nama")
          const kelasIdx = header.indexOf("id_kelas")

          for (let i = 1; i < lines.length; i++) {
            const cols = parseCsvLine(lines[i])
            if (cols.length < 3) {
              errors.push(`Baris ${i + 1}: format tidak valid`)
              continue
            }
            try {
              await conn.query(
                "INSERT INTO siswa (nisn, nama, id_kelas) VALUES (?, ?, ?)",
                [cols[nisnIdx].trim(), cols[namaIdx].trim(), parseInt(cols[kelasIdx])]
              )
              imported++
            } catch (e) {
              errors.push(`Baris ${i + 1}: ${(e as Error).message}`)
            }
          }
          break
        }
        case "kelas": {
          if (!header.includes("nama") || !header.includes("tingkat") || !header.includes("jurusan")) {
            return errorResponse("Format CSV kelas: nama,tingkat,jurusan", 400)
          }
          const namaIdx = header.indexOf("nama")
          const tingkatIdx = header.indexOf("tingkat")
          const jurusanIdx = header.indexOf("jurusan")

          for (let i = 1; i < lines.length; i++) {
            const cols = parseCsvLine(lines[i])
            if (cols.length < 3) {
              errors.push(`Baris ${i + 1}: format tidak valid`)
              continue
            }
            try {
              await conn.query(
                "INSERT INTO kelas (nama, tingkat, jurusan) VALUES (?, ?, ?)",
                [cols[namaIdx].trim(), parseInt(cols[tingkatIdx]), cols[jurusanIdx].trim()]
              )
              imported++
            } catch (e) {
              errors.push(`Baris ${i + 1}: ${(e as Error).message}`)
            }
          }
          break
        }
        case "wali_kelas": {
          if (!header.includes("username") || !header.includes("password") ||
              !header.includes("nama") || !header.includes("id_kelas")) {
            return errorResponse("Format CSV wali kelas: username,password,nama,id_kelas", 400)
          }
          const usrIdx = header.indexOf("username")
          const pwdIdx = header.indexOf("password")
          const namaIdx = header.indexOf("nama")
          const kelasIdx = header.indexOf("id_kelas")

          for (let i = 1; i < lines.length; i++) {
            const cols = parseCsvLine(lines[i])
            if (cols.length < 4) {
              errors.push(`Baris ${i + 1}: format tidak valid`)
              continue
            }
            try {
              await conn.query(
                "INSERT INTO wali_kelas (username, password, nama, id_kelas) VALUES (?, ?, ?, ?)",
                [cols[usrIdx].trim(), cols[pwdIdx].trim(), cols[namaIdx].trim(), parseInt(cols[kelasIdx])]
              )
              imported++
            } catch (e) {
              errors.push(`Baris ${i + 1}: ${(e as Error).message}`)
            }
          }
          break
        }
        default:
          conn.release()
          return errorResponse("Tipe data tidak valid", 400)
      }

      conn.release()
      return successResponse({ imported, errors })
    } catch (e) {
      conn.release()
      throw e
    }
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Unauthorized") return errorResponse("Unauthorized", 401)
      if (err.message === "Forbidden") return errorResponse("Forbidden", 403)
    }
    console.error("Import CSV error:", err)
    return errorResponse("Terjadi kesalahan server", 500)
  }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}
