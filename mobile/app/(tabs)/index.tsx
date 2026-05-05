import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native"
import { useAuth } from "../../lib/auth"
import { checkLocation, type LocationStatus } from "../../lib/location"
import { api } from "../../lib/api"

type AbsenType = "masuk" | "pulang" | null
type AbsenLoading = "masuk" | "pulang" | null

interface TimeCheck {
  jam: string
  absenMasuk: boolean
  absenPulang: boolean
  statusMasuk: "tepat" | "terlambat" | "tutup"
}

function getTimeStatus(): TimeCheck {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  const jam = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`

  let absenMasuk = false
  let absenPulang = false
  let statusMasuk: "tepat" | "terlambat" | "tutup" = "tutup"

  if (h >= 6 && h < 7) {
    absenMasuk = true
    statusMasuk = "tepat"
  } else if (h === 7 && m < 30) {
    absenMasuk = true
    statusMasuk = "tepat"
  } else if ((h === 7 && m >= 30) || (h === 8 && m < 60)) {
    absenMasuk = true
    statusMasuk = "terlambat"
  } else if (h >= 14 && h < 17 && m < 60) {
    absenPulang = true
  }

  return { jam, absenMasuk, absenPulang, statusMasuk }
}

export default function BerandaScreen() {
  const { user, token, logout } = useAuth()
  const [serverTime, setServerTime] = useState("--:--")
  const [locStatus, setLocStatus] = useState<LocationStatus | null>(null)
  const [absenLoading, setAbsenLoading] = useState<AbsenLoading>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [timeCheck, setTimeCheck] = useState(getTimeStatus)

  useEffect(() => {
    const interval = setInterval(() => setTimeCheck(getTimeStatus()), 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    refreshLocation()
  }, [])

  const refreshLocation = useCallback(async () => {
    setRefreshing(true)
    const status = await checkLocation()
    setLocStatus(status)

    try {
      const res = await api.serverTime()
      if (res.success && res.data) {
        setServerTime(res.data.waktu)
      }
    } catch {
      // gunakan waktu lokal
      const now = new Date()
      setServerTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`)
    }

    setRefreshing(false)
  }, [])

  const handleAbsen = async (jenis: "masuk" | "pulang") => {
    setMessage(null)

    if (!locStatus?.granted) {
      setMessage({ type: "error", text: "Izin lokasi tidak diberikan." })
      return
    }
    if (locStatus.mockDetected) {
      setMessage({ type: "error", text: "Fake GPS terdeteksi. Absensi dibatalkan." })
      return
    }
    if (!locStatus.insideRadius) {
      setMessage({ type: "error", text: `Di luar radius sekolah (${locStatus.distanceMeter}m).` })
      return
    }
    if (!locStatus.latitude || !locStatus.longitude) {
      setMessage({ type: "error", text: "Koordinat tidak tersedia." })
      return
    }

    setAbsenLoading(jenis)
    try {
      await api.absen(
        {
          nisn: user!.nisn,
          latitude: locStatus.latitude,
          longitude: locStatus.longitude,
          jenis,
        },
        user!.token
      )
      setMessage({ type: "success", text: "Absensi berhasil tercatat!" })
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Gagal absen" })
    } finally {
      setAbsenLoading(null)
    }
  }

  const statusColor = (active: boolean) => (active ? "#16a34a" : "#9ca3af")
  const statusText = (active: boolean) => (active ? "Aktif" : "Nonaktif")

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshLocation} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Halo, {user?.nama?.split(" ")[0]}</Text>
          <Text style={styles.classInfo}>{user?.nama_kelas}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      {/* Server Time */}
      <View style={styles.timeCard}>
        <Text style={styles.timeLabel}>Waktu Server</Text>
        <Text style={styles.timeValue}>{serverTime} WIB</Text>
      </View>

      {/* Status Bar */}
      <View style={styles.statusRow}>
        <View style={styles.statusItem}>
          <View style={[styles.dot, { backgroundColor: statusColor(locStatus?.granted ?? false) }]} />
          <Text style={styles.statusText}>{locStatus?.granted ? "GPS OK" : "GPS OFF"}</Text>
        </View>
        <View style={styles.statusItem}>
          <View style={[styles.dot, { backgroundColor: locStatus?.mockDetected ? "#dc2626" : statusColor(true) }]} />
          <Text style={styles.statusText}>
            {locStatus?.mockDetected ? "Fake GPS!" : "No Mock"}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <View style={[styles.dot, { backgroundColor: statusColor(locStatus?.insideRadius ?? false) }]} />
          <Text style={styles.statusText}>
            {locStatus?.insideRadius ? "Di Sekolah" : "Di Luar"}
          </Text>
        </View>
      </View>

      {locStatus?.error && !locStatus.mockDetected && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>{locStatus.error}</Text>
        </View>
      )}

      {/* Message */}
      {message && (
        <View style={[styles.msgBox, message.type === "success" ? styles.msgSuccess : styles.msgError]}>
          <Text style={message.type === "success" ? styles.msgSuccessText : styles.msgErrorText}>
            {message.text}
          </Text>
        </View>
      )}

      {/* Absen Buttons */}
      <View style={styles.absenSection}>
        {/* Masuk */}
        <TouchableOpacity
          style={[
            styles.absenBtn,
            styles.absenMasuk,
            !timeCheck.absenMasuk && styles.btnDisabled,
          ]}
          onPress={() => handleAbsen("masuk")}
          disabled={!timeCheck.absenMasuk || absenLoading !== null}
          activeOpacity={0.8}
        >
          {absenLoading === "masuk" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.absenEmoji}>📥</Text>
              <Text style={styles.absenLabel}>Absen Masuk</Text>
              <Text style={styles.absenTime}>
                {timeCheck.absenMasuk
                  ? timeCheck.statusMasuk === "terlambat"
                    ? "Terlambat"
                    : "06:00 - 07:30"
                  : "Tutup"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Pulang */}
        <TouchableOpacity
          style={[
            styles.absenBtn,
            styles.absenPulang,
            !timeCheck.absenPulang && styles.btnDisabled,
          ]}
          onPress={() => handleAbsen("pulang")}
          disabled={!timeCheck.absenPulang || absenLoading !== null}
          activeOpacity={0.8}
        >
          {absenLoading === "pulang" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.absenEmoji}>📤</Text>
              <Text style={styles.absenLabel}>Absen Pulang</Text>
              <Text style={styles.absenTime}>
                {timeCheck.absenPulang ? "14:30 - 17:00" : "Tutup"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Informasi</Text>
        <Text style={styles.infoText}>
          • Absen Masuk: 06:00 - 07:30 (Tepat) | 07:30 - 09:00 (Terlambat){'\n'}
          • Absen Pulang: 14:30 - 17:00{'\n'}
          • Pastikan GPS aktif & tidak menggunakan Fake GPS{'\n'}
          • Anda harus berada di area sekolah
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  classInfo: {
    color: "#bfdbfe",
    fontSize: 13,
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  logoutText: {
    color: "#fff",
    fontSize: 13,
  },
  timeCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  timeLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 2,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 16,
    marginHorizontal: 16,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#6b7280",
  },
  warningBox: {
    backgroundColor: "#fef3c7",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    padding: 12,
  },
  warningText: {
    fontSize: 12,
    color: "#92400e",
  },
  msgBox: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    padding: 12,
  },
  msgSuccess: {
    backgroundColor: "#dcfce7",
  },
  msgError: {
    backgroundColor: "#fef2f2",
  },
  msgSuccessText: {
    fontSize: 13,
    color: "#166534",
    textAlign: "center",
    fontWeight: "600",
  },
  msgErrorText: {
    fontSize: 13,
    color: "#991b1b",
    textAlign: "center",
  },
  absenSection: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 24,
  },
  absenBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  absenMasuk: {
    backgroundColor: "#059669",
  },
  absenPulang: {
    backgroundColor: "#2563eb",
  },
  btnDisabled: {
    backgroundColor: "#d1d5db",
  },
  absenEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  absenLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  absenTime: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 30,
    borderRadius: 10,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 20,
  },
})
