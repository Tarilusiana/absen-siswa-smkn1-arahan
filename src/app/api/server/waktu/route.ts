import { successResponse } from "@/lib/auth-helpers"

export async function GET() {
  const now = new Date()
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  const waktu = wib.toISOString().slice(11, 19)

  return successResponse({ waktu })
}
