"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/attendance/status-badge"
import { useAuth } from "@/lib/auth"
import { api } from "@/lib/api"
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  GraduationCap,
} from "lucide-react"
import type { RekapHarian, Absensi, ApiResponse } from "@/types"

export default function DashboardPage() {
  const { token, user, isAdmin } = useAuth()

  const { data: rekapToday, isLoading: rekapLoading } = useQuery({
    queryKey: ["rekap-harian", user?.id_kelas],
    queryFn: () =>
      api.get<ApiResponse<RekapHarian[]>>(
        `/rekap/harian${isAdmin ? "" : `?id_kelas=${user?.id_kelas}`}`,
        token ?? undefined
      ),
    enabled: !!token,
  })

  const { data: absensiList, isLoading: absensiLoading } = useQuery({
    queryKey: ["absensi-today", user?.id_kelas],
    queryFn: () =>
      api.get<ApiResponse<Absensi[]>>(
        `/absensi/hari-ini${isAdmin ? "" : `?id_kelas=${user?.id_kelas}`}`,
        token ?? undefined
      ),
    enabled: !!token,
  })

  const todayRekap = rekapToday?.data?.[0]

  const statsCards = [
    {
      title: "Total Siswa",
      value: todayRekap?.total ?? 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Hadir Hari Ini",
      value: (todayRekap?.hadir ?? 0) + (todayRekap?.terlambat ?? 0),
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Terlambat",
      value: todayRekap?.terlambat ?? 0,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Tanpa Keterangan",
      value: todayRekap?.alpa ?? 0,
      icon: UserX,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      title: "Sakit",
      value: todayRekap?.sakit ?? 0,
      icon: AlertTriangle,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Izin",
      value: todayRekap?.izin ?? 0,
      icon: GraduationCap,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-gray-500">
          Rekapitulasi kehadiran siswa
          {!isAdmin && ` - ${user?.nama}`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.title}
              </CardTitle>
              <div className={`rounded-md p-1.5 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {rekapLoading ? "-" : stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status Kehadiran Hari Ini</CardTitle>
        </CardHeader>
        <CardContent>
          {absensiLoading ? (
            <p className="py-8 text-center text-sm text-gray-500">Memuat data...</p>
          ) : !absensiList?.data?.length ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Belum ada data absensi hari ini
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-gray-500">NISN</th>
                    <th className="pb-3 font-medium text-gray-500">Nama</th>
                    <th className="pb-3 font-medium text-gray-500">Kelas</th>
                    <th className="pb-3 font-medium text-gray-500">Jam Masuk</th>
                    <th className="pb-3 font-medium text-gray-500">Jam Pulang</th>
                    <th className="pb-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {absensiList.data.map((absensi) => (
                    <tr key={absensi.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2.5">{absensi.nisn}</td>
                      <td className="py-2.5 font-medium">{absensi.nama_siswa}</td>
                      <td className="py-2.5">{absensi.nama_kelas}</td>
                      <td className="py-2.5">{absensi.jam_masuk ?? "-"}</td>
                      <td className="py-2.5">{absensi.jam_pulang ?? "-"}</td>
                      <td className="py-2.5">
                        <StatusBadge status={absensi.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
