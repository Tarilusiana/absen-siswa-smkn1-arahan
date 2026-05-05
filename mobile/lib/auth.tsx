import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import * as SecureStore from "expo-secure-store"
import * as Device from "expo-device"
import { api } from "./api"
import type { UserData } from "../types"

interface AuthContextType {
  user: UserData | null
  loading: boolean
  deviceId: string
  token: string | null
  login: (nisn: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USER_KEY = "user_data"
const TOKEN_KEY = "auth_token"
const DEVICE_ID_KEY = "device_id_fingerprint"

async function resolveDeviceId(): Promise<string> {
  const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY)
  if (stored) return stored

  const brand = Device.brand || "unknown"
  const model = Device.modelName || "unknown"
  const os = Device.osName || "android"
  const id = Device.osBuildId || `${brand}-${model}-${Date.now()}`
  const deviceId = `${brand}-${model}-${os}-${id}`.replace(/\s+/g, "_").slice(0, 100)

  await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId)
  return deviceId
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [deviceId, setDeviceId] = useState("")

  useEffect(() => {
    (async () => {
      try {
        const [stored, did] = await Promise.all([
          SecureStore.getItemAsync(USER_KEY),
          resolveDeviceId(),
        ])
        setDeviceId(did)
        if (stored) setUser(JSON.parse(stored))
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const login = useCallback(async (nisn: string, password: string) => {
    const did = await resolveDeviceId()
    const res = await api.loginSiswa(nisn, password, did)
    if (res.success && res.data) {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(res.data))
      await SecureStore.setItemAsync(TOKEN_KEY, res.data.token)
      setUser(res.data)
      setDeviceId(did)
    } else {
      throw new Error(res.message || "Login gagal")
    }
  }, [])

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(USER_KEY)
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    setUser(null)
  }, [])

  const token = user?.token || null

  return (
    <AuthContext.Provider value={{ user, loading, deviceId, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
