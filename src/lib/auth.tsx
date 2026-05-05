"use client"

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import type { User, LoginPayload, ApiResponse } from "@/types"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
  isAdmin: boolean
  isWaliKelas: boolean
  token: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem("user")
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    localStorage.removeItem("user")
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const login = useCallback(async (payload: LoginPayload) => {
    setLoading(true)
    try {
      const res = await api.post<ApiResponse<User>>("/auth/login", payload)
      if (res.success && res.data) {
        localStorage.setItem("user", JSON.stringify(res.data))
        setUser(res.data)
        router.push("/dashboard")
      } else {
        throw new Error(res.message || "Login gagal")
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  const logout = useCallback(() => {
    localStorage.removeItem("user")
    setUser(null)
    router.push("/login")
  }, [router])

  const token = user?.token || null

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAdmin: user?.role === "admin",
      isWaliKelas: user?.role === "wali_kelas",
      token,
    }),
    [user, loading, login, logout, token]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
