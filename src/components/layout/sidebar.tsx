"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth"
import {
  LayoutDashboard,
  FileSpreadsheet,
  ClipboardCheck,
  GraduationCap,
  Users,
  UserCheck,
  Upload,
  LogOut,
} from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const { user, isAdmin, logout } = useAuth()

  const menuItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "wali_kelas"],
    },
    {
      href: "/laporan",
      label: "Laporan Kehadiran",
      icon: FileSpreadsheet,
      roles: ["admin", "wali_kelas"],
    },
    {
      href: "/absensi-manual",
      label: "Input Kehadiran Manual",
      icon: ClipboardCheck,
      roles: ["admin", "wali_kelas"],
    },
  ]

  const adminItems = [
    {
      href: "/admin/kelas",
      label: "Manajemen Kelas",
      icon: GraduationCap,
    },
    {
      href: "/admin/siswa",
      label: "Manajemen Siswa",
      icon: Users,
    },
    {
      href: "/admin/wali-kelas",
      label: "Manajemen Wali Kelas",
      icon: UserCheck,
    },
    {
      href: "/admin/siswa/import",
      label: "Import CSV",
      icon: Upload,
    },
  ]

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-14 items-center border-b border-gray-200 px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-blue-700">
          <GraduationCap className="h-5 w-5" />
          <span className="text-sm">SMKN 1 Arahan</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {menuItems
            .filter((item) => item.roles.includes(user?.role || ""))
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
        </nav>

        {isAdmin && (
          <>
            <div className="mt-6 mb-2 px-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Admin</p>
            </div>
            <nav className="space-y-1 px-3">
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </>
        )}
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="mb-3 text-xs text-gray-500">
          <p className="font-medium text-gray-900">{user?.nama}</p>
          <p>{user?.role === "admin" ? "Administrator" : "Wali Kelas"}</p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>
    </aside>
  )
}
