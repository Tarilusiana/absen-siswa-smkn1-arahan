"use client"

import { useAuth } from "@/lib/auth"
import { Bell, Menu } from "lucide-react"

interface HeaderProps {
  onMenuClick?: () => void
  showMenu?: boolean
}

export function Header({ onMenuClick, showMenu }: HeaderProps) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        {showMenu && (
          <button
            onClick={onMenuClick}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-sm font-semibold text-gray-900">
          Selamat datang, {user?.nama}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xs text-gray-500">
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
            Online
          </span>
        </div>
        <button className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
