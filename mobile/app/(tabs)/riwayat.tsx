import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { useAuth } from "../../lib/auth"
import { api } from "../../lib/api"
import type { AbsensiRecord } from "../../types"

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  H: { label: "Hadir", color: "#059669" },
  T: { label: "Terlambat", color: "#6b7280" },
  S: { label: "Sakit", color: "#d97706" },
  I: { label: "Izin", color: "#2563eb" },
  A: { label: "Alpa", color: "#dc2626" },
}

export default function RiwayatScreen() {
  const { user } = useAuth()
  const [data, setData] = useState<AbsensiRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const fetchRiwayat = async () => {
    if (!user) return
    setError("")
    try {
      const res = await api.riwayat(user.nisn, user.token)
      if (res.success && res.data) {
        setData((res.data.riwayat || []) as AbsensiRecord[])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat riwayat")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRiwayat()
  }, [])

  const formatDate = (d: string) => {
    const date = new Date(d)
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Riwayat Kehadiran</Text>
        <Text style={styles.subtitle}>{user?.nama} &middot; {user?.nisn}</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRiwayat() }} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>Belum ada data kehadiran</Text>
          </View>
        ) : (
          data.map((item, idx) => {
            const status = STATUS_MAP[item.status] || { label: item.status, color: "#9ca3af" }
            return (
              <View key={item.id || idx} style={styles.card}>
                <View style={styles.cardLeft}>
                  <Text style={styles.dateText}>{formatDate(item.tanggal)}</Text>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>Masuk: </Text>
                    <Text style={styles.timeValue}>{item.jam_masuk || "-"}</Text>
                    <Text style={styles.timeLabel}>  Pulang: </Text>
                    <Text style={styles.timeValue}>{item.jam_pulang || "-"}</Text>
                  </View>
                  {item.keterangan ? (
                    <Text style={styles.keterangan}>{item.keterangan}</Text>
                  ) : null}
                </View>
                <View style={[styles.badge, { backgroundColor: status.color }]}>
                  <Text style={styles.badgeText}>{status.label}</Text>
                </View>
              </View>
            )
          })
        )}
      </ScrollView>
    </View>
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
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    color: "#bfdbfe",
    fontSize: 13,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    textAlign: "center",
  },
  emptyBox: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardLeft: {
    flex: 1,
  },
  dateText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  timeRow: {
    flexDirection: "row",
    marginTop: 4,
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 12,
    color: "#9ca3af",
  },
  timeValue: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  keterangan: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
    fontStyle: "italic",
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
})
