Berikut adalah dokumen final *Product Requirements Document* (PRD) dan *App Flow* yang telah disatukan dan disempurnakan, siap digunakan sebagai acuan pengembangan sistem absensi di SMKN 1 Arahan.

---

# PRODUCT REQUIREMENTS DOCUMENT (PRD)
**Nama Proyek:** Aplikasi Absensi Geolocation Siswa SMKN 1 Arahan
**Platform:** Android App (Siswa) & Web Dashboard (Wali Kelas & Admin)
**Teknologi:** Next.js (Web & API), MariaDB (Database), Android Native/React Native (Mobile)

## 1. Ringkasan Eksekutif
Aplikasi ini adalah sistem presensi digital berbasis lokasi (*geolocation*) yang dirancang khusus untuk siswa. Sistem ini beroperasi tanpa verifikasi wajah (selfie), mengandalkan validasi koordinat GPS dalam radius sekolah, waktu server yang presisi, dan pengikatan identitas perangkat (*Device Binding*) yang diperkuat dengan proteksi anti-*Fake GPS* untuk mencegah kecurangan.

## 2. Parameter Waktu & Validasi Kehadiran
Sistem menggunakan waktu server terpusat dengan parameter operasional tombol absensi pada aplikasi mobile sebagai berikut:
*   **06:00 - 07:30 WIB:** Absen Masuk (Status: Hadir Tepat Waktu)
*   **07:30 - 09:00 WIB:** Absen Masuk (Status: Terlambat)
*   **09:01 - 14:29 WIB:** Tombol absen masuk/pulang dinonaktifkan.
*   **14:30 - 17:00 WIB:** Absen Pulang (Berlaku bagi siswa yang sudah melakukan absen masuk)
*   *Catatan:* Siswa yang tidak melakukan absen masuk hingga jam 09:00 WIB otomatis tercatat "Alpa" oleh sistem, kecuali ada intervensi "Titip Absen" dari Wali Kelas/Admin.

## 3. Spesifikasi Fitur Berdasarkan Role

### A. Role: Siswa (Aplikasi Mobile Android)
*   **Device Binding (Kunci Perangkat):** Saat login pertama, sistem merekam *Device ID*. Login di perangkat berbeda akan otomatis ditolak.
*   **Persistent Session:** Token sesi tersimpan aman di perangkat. Siswa tidak perlu login ulang setiap hari.
*   **Anti-Fake GPS & Geofencing:** Sebelum memproses absen, aplikasi memvalidasi izin *Mock Location*. Jika terindikasi *Fake GPS*, proses dibatalkan. Jika bersih, sistem memverifikasi bahwa titik koordinat siswa berada di dalam radius SMKN 1 Arahan.
*   **One-Tap Action:** Tampilan utama sederhana dengan tombol "Absen Masuk" dan "Absen Pulang" yang aktif sesuai jam yang ditentukan.
*   **Riwayat Pribadi:** Menampilkan riwayat kehadiran harian milik siswa tersebut.

### B. Role: Wali Kelas (Web Panel)
*   **Dashboard Kelas Terbatas:** Akses data dan statistik difilter secara eksklusif hanya untuk kelas yang diampu.
*   **Laporan Matriks Bulanan:** Tampilan rekapitulasi tabular (Baris: Siswa, Kolom: Tanggal 1-31) dengan status warna/kode (H, S, I, A, T).
*   **Cetak & Export:** Fasilitas unduh laporan per kelas maupun rekam jejak individu per siswa dalam format PDF dan export data mentah ke *CSV*.
*   **Titip Absen (Manual Backdate):** Kewenangan untuk menginput status Sakit, Izin, atau Alpa, maupun meralat kehadiran siswa. Batas maksimal modifikasi data adalah **10 hari ke belakang (H-10)** dari tanggal sistem saat ini.

### C. Role: Admin (Web Panel)
*   **Hak Akses Global:** Memiliki seluruh kapabilitas Wali Kelas tanpa batasan kelas (mengelola seluruh siswa SMKN 1 Arahan).
*   **Manajemen Master Data (CRUD):** Tambah, Baca, Perbarui, dan Hapus data pada entitas Kelas, Siswa, dan Wali Kelas.
*   **Bulk Import CSV:** Fitur unggah dokumen CSV untuk mempercepat inisialisasi data Kelas, Siswa, dan penugasan Wali Kelas ke dalam MariaDB.
*   **Reset Device ID:** Fitur krusial untuk menghapus/mereset *Device ID* siswa yang mengalami kendala perangkat (HP rusak, hilang, atau ganti baru), sehingga siswa dapat melakukan *binding* ulang di perangkat baru.

---

# APP FLOW (ALUR SISTEM)

## 1. Alur Penggunaan Siswa (Android)
1.  **Inisiasi Aplikasi:** Siswa membuka aplikasi.
2.  **Pemeriksaan Sesi & Perangkat:**
    *   Jika belum login, diarahkan ke form Login (Input Username/NISN & Password).
    *   Aplikasi mengirim Kredensial + *Device ID* ke API Next.js.
    *   Jika *Device ID* tidak cocok dengan MariaDB -> Akses Ditolak.
    *   Jika cocok atau baru pertama kali -> Login Sukses, sesi disimpan.
3.  **Tampilan Beranda:** Menampilkan Jam Server, Status Jaringan, Status GPS, dan Tombol Absen yang relevan.
4.  **Eksekusi Absen:**
    *   Siswa menekan tombol "Absen Masuk" (misal pada pukul 06:45 WIB).
    *   Aplikasi memeriksa *Mock Location*. Jika aktif -> Muncul Notifikasi Error, alur berhenti.
    *   Jika aman, aplikasi mengambil koordinat dan mengirim *payload* ke API.
    *   API memvalidasi jarak (Geofencing) dan memvalidasi waktu.
    *   Data direkam ke database, layar menampilkan centang hijau "Kehadiran Berhasil Tercatat".

## 2. Alur Penggunaan Wali Kelas (Web)
1.  **Akses Portal:** Membuka URL absensi sekolah dan login.
2.  **Pemantauan Harian:** Melihat grafik atau rekap kehadiran siswa di kelasnya hari ini.
3.  **Proses Titip Absen:**
    *   Siswa menyerahkan surat sakit/izin ke Wali Kelas.
    *   Wali Kelas membuka menu "Input Kehadiran Manual".
    *   Memilih tanggal absensi (sistem memblokir pemilihan tanggal lebih dari 10 hari yang lalu).
    *   Mencari nama siswa, mengubah status menjadi "Sakit", mengklik "Simpan".
4.  **Proses Rekapitulasi Akhir Bulan:**
    *   Membuka menu "Laporan Kehadiran".
    *   Memilih parameter bulan dan tahun.
    *   Mengklik "Export CSV" untuk diolah lebih lanjut atau "Cetak Laporan" untuk arsip.

## 3. Alur Penggunaan Admin (Web)
1.  **Setup Awal Semester (Bulk Data):**
    *   Admin menyiapkan format CSV standar (NISN, Nama, ID Kelas, dll).
    *   Login dan masuk ke menu "Manajemen Data -> Siswa -> Import CSV".
    *   Sistem memproses file dan mem-populate tabel di MariaDB secara massal.
2.  **Penanganan Kasus Ganti Perangkat Siswa:**
    *   Wali Kelas/Siswa melapor pergantian HP.
    *   Admin masuk ke menu "Manajemen Siswa".
    *   Mencari nama/NISN siswa tersebut.
    *   Mengklik tombol aksi "Reset Device". Tampil konfirmasi peringatan. Admin menyetujui.
    *   Kolom `device_id` di database kembali *NULL*. Siswa kini dapat login di HP barunya.
