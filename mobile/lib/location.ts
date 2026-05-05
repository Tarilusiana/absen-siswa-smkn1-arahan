import * as Location from "expo-location"

const SEKOLAH_LAT = -6.123456  // Koordinat SMKN 1 Arahan (sesuaikan)
const SEKOLAH_LNG = 107.654321  // Koordinat SMKN 1 Arahan (sesuaikan)
const RADIUS_METER = 500        // Radius geofencing dalam meter

export interface LocationStatus {
  granted: boolean
  mockDetected: boolean
  latitude: number | null
  longitude: number | null
  insideRadius: boolean
  distanceMeter: number | null
  error: string | null
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function checkLocation(): Promise<LocationStatus> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()

    if (status !== "granted") {
      return {
        granted: false,
        mockDetected: false,
        latitude: null,
        longitude: null,
        insideRadius: false,
        distanceMeter: null,
        error: "Izin lokasi tidak diberikan. Aktifkan GPS dan izin lokasi.",
      }
    }

    const provider = await Location.getProviderStatusAsync()
    if (!provider.locationServicesEnabled) {
      return {
        granted: true,
        mockDetected: false,
        latitude: null,
        longitude: null,
        insideRadius: false,
        distanceMeter: null,
        error: "GPS tidak aktif. Silakan nyalakan GPS.",
      }
    }

    const isMock = await Location.hasServicesEnabledAsync()

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    })

    if (location.mocked === true) {
      return {
        granted: true,
        mockDetected: true,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        insideRadius: false,
        distanceMeter: null,
        error: "Fake GPS terdeteksi! Matikan aplikasi pemalsu lokasi.",
      }
    }

    const distance = haversineDistance(
      location.coords.latitude,
      location.coords.longitude,
      SEKOLAH_LAT,
      SEKOLAH_LNG
    )

    const inside = distance <= RADIUS_METER

    return {
      granted: true,
      mockDetected: false,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      insideRadius: inside,
      distanceMeter: Math.round(distance),
      error: inside ? null : `Anda berada di luar radius sekolah (${Math.round(distance)}m dari sekolah).`,
    }
  } catch (err) {
    return {
      granted: false,
      mockDetected: false,
      latitude: null,
      longitude: null,
      insideRadius: false,
      distanceMeter: null,
      error: "Gagal mendapatkan lokasi. Pastikan GPS aktif.",
    }
  }
}
