# Deploy Absensi SMKN 1 Arahan ke VPS

Panduan lengkap deploy aplikasi Next.js (Web Dashboard + API) ke VPS Ubuntu/Debian.

## 1. Persiapan VPS

### Update System & Install Dependencies

```bash
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi
node --version   # harus v20.x
npm --version    # harus 10.x

# Install MariaDB
sudo apt install -y mariadb-server
sudo systemctl enable mariadb
sudo systemctl start mariadb
sudo mysql_secure_installation

# Install PM2 (process manager) & Nginx
sudo npm install -g pm2
sudo apt install -y nginx
sudo systemctl enable nginx
```

### Setup Firewall

```bash
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

---

## 2. Setup Database

### Buat Database & User

```bash
sudo mariadb
```

```sql
CREATE DATABASE absensiswaopencode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'absen_app'@'localhost' IDENTIFIED BY 'PASSWORD_AMAN_ANDA';
GRANT ALL PRIVILEGES ON absensiswaopencode.* TO 'absen_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Import Struktur Tabel

```bash
sudo mariadb absensiswaopencode < src/lib/migration.sql
```

### Seed Data Awal (Opsional)

```sql
USE absensiswaopencode;

-- Admin
INSERT INTO admin (username, password, nama) VALUES ('admin', 'admin123', 'Administrator');

-- Contoh Kelas
INSERT INTO kelas (nama, tingkat, jurusan) VALUES
('X RPL 1', 10, 'RPL'),
('XI RPL 1', 11, 'RPL'),
('XII RPL 1', 12, 'RPL');

-- Contoh Wali Kelas
INSERT INTO wali_kelas (username, password, nama, id_kelas) VALUES
('wali_rpl1', 'password123', 'Bpk. Ahmad', 1);
```

---

## 3. Clone & Setup Aplikasi

```bash
git clone https://github.com/Tarilusiana/absen-siswa-smkn1-arahan.git /opt/absen-siswa
cd /opt/absen-siswa
```

### Konfigurasi Environment

```bash
cp .env.example .env
nano .env
```

Isi `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=absen_app
DB_PASSWORD=PASSWORD_AMAN_ANDA
DB_NAME=absensiswaopencode
JWT_SECRET=isi-dengan-random-string-minimal-32-karakter
NEXT_PUBLIC_API_URL=/api
```

Generate JWT_SECRET:

```bash
openssl rand -base64 32
```

### Sesuaikan Koordinat Sekolah

Buka 2 file ini dan ganti koordinat dengan lokasi asli SMKN 1 Arahan:

```bash
# Koordinat untuk API (validasi absen mobile)
nano src/app/api/absensi/absen/route.ts

# Koordinat untuk mobile app (pre-check di HP)
nano mobile/lib/location.ts
```

### Install & Build

```bash
npm install
npm run build
```

Pastikan build sukses tanpa error.

---

## 4. Jalankan dengan PM2

```bash
# Start aplikasi
pm2 start ecosystem.config.cjs

# Auto-start saat VPS reboot
pm2 save
pm2 startup
# Ikuti perintah yang muncul
```

### Command PM2 Berguna

```bash
pm2 status           # Lihat status
pm2 logs absen-siswa # Lihat log
pm2 restart absen-siswa  # Restart setelah update kode
pm2 stop absen-siswa     # Stop
pm2 delete absen-siswa   # Hapus dari daftar

# Setelah git pull + npm run build:
pm2 restart absen-siswa
```

---

## 5. Setup Nginx Reverse Proxy

### Buat Config Nginx

```bash
sudo nano /etc/nginx/sites-available/absen-siswa
```

```nginx
server {
    listen 80;
    server_name ABSENSI_DOMAIN_ANDA;   # Ganti dengan domain/IP VPS

    client_max_body_size 10M;          # Untuk upload CSV

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600";
    }
}
```

### Aktifkan Config

```bash
sudo ln -s /etc/nginx/sites-available/absen-siswa /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Hapus default
sudo nginx -t                              # Test config
sudo systemctl reload nginx
```

### Setup SSL (HTTPS) — Optional

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ABSENSI_DOMAIN_ANDA
sudo certbot renew --dry-run  # Test auto-renewal
```

---

## 6. Verifikasi

1. Buka browser → akses domain/IP VPS
2. Login dengan akun admin: `admin` / `admin123`
3. Test CRUD kelas, siswa, wali kelas
4. Test laporan & export CSV

### Test API Mobile

```bash
# Server time
curl http://localhost:3000/api/server/waktu

# Login siswa
curl -X POST http://localhost:3000/api/auth/login/siswa \
  -H "Content-Type: application/json" \
  -d '{"nisn":"10001","password":"siswa10001","device_id":"test-device"}'
```

---

## 7. Update Aplikasi

Setiap ada perubahan kode yang di-push ke GitHub:

```bash
cd /opt/absen-siswa
git pull
npm install          # Kalau ada dependency baru
npm run build        # Penting!
pm2 restart absen-siswa
```

---

## 8. Build APK Mobile

Setelah web + API berjalan, build APK untuk siswa:

```bash
cd mobile
nano lib/api.ts   # Ganti API_BASE ke domain VPS: https://domain/api
```

Lalu build APK:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login ke Expo
eas login

# Build APK
eas build --platform android --profile production
```

Atau build lokal dengan Android Studio:

```bash
npx expo prebuild
cd android
./gradlew assembleRelease
# APK ada di: android/app/build/outputs/apk/release/
```

---

## 9. Troubleshooting

### Aplikasi tidak bisa akses database
```bash
# Test koneksi DB
mariadb -u absen_app -p -h localhost absensiswaopencode
pm2 logs absen-siswa --lines 50
```

### Port 3000 sudah dipakai
```bash
sudo lsof -i :3000
sudo kill -9 PID
pm2 restart absen-siswa
```

### Nginx 502 Bad Gateway
```bash
pm2 status                                    # Pastikan app running
sudo tail -f /var/log/nginx/error.log         # Cek log Nginx
```

### Reset device siswa yang terkunci
```bash
# Via Web Dashboard: Admin → Manajemen Siswa → klik tombol Reset Device

# Atau via SQL:
sudo mariadb absensiswaopencode -e "UPDATE siswa SET device_id = NULL WHERE nisn = 'NISN_SISWA'"
```
