# Deploy Absensi SMKN 1 Arahan ke VPS

Panduan langkah-demi-langkah deploy Next.js (Web + API) ke VPS Ubuntu/Debian.

---

### Langkah 1 — Update sistem & install dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx mariadb-server
sudo npm install -g pm2
```

Pastikan Node.js v18+ sudah terinstall (`node --version`). VPS ini pakai v22 — ok.

---

### Langkah 2 — Setup firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

### Langkah 3 — Setup MariaDB

```bash
sudo systemctl enable mariadb
sudo systemctl start mariadb
sudo mysql_secure_installation
```

Buat database dan user:

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

---

### Langkah 4 — Clone repository

```bash
git clone https://github.com/Tarilusiana/absen-siswa-smkn1-arahan.git /opt/absen-siswa
cd /opt/absen-siswa
```

---

### Langkah 5 — Import struktur database

```bash
sudo mariadb absensiswaopencode < src/lib/migration.sql
```

---

### Langkah 6 — Seed data awal

```bash
sudo mariadb absensiswaopencode
```

```sql
INSERT INTO admin (username, password, nama) VALUES ('admin', 'admin123', 'Administrator');

INSERT INTO kelas (nama, tingkat, jurusan) VALUES
('X RPL 1', 10, 'RPL'),
('X RPL 2', 10, 'RPL'),
('XI RPL 1', 11, 'RPL'),
('X TKJ 1', 10, 'TKJ');

INSERT INTO siswa (nisn, nama, id_kelas, password) VALUES
('10001', 'Ahmad Fauzi', 1, 'siswa10001'),
('10002', 'Budi Santoso', 1, 'siswa10002'),
('10003', 'Citra Dewi', 1, 'siswa10003'),
('10004', 'Dian Permata', 1, 'siswa10004'),
('10005', 'Eko Prasetyo', 1, 'siswa10005');

INSERT INTO wali_kelas (username, password, nama, id_kelas) VALUES
('wali_rpl1', 'wali123', 'Bpk. Supriyadi, S.Kom', 1),
('wali_rpl2', 'wali123', 'Ibu. Ratna Dewi, S.T', 2),
('wali_rpl3', 'wali123', 'Bpk. Hendra Gunawan, M.Pd', 3),
('wali_tkj1', 'wali123', 'Ibu. Maya Anggraini, S.Kom', 4);

EXIT;
```

---

### Langkah 7 — Konfigurasi .env

```bash
cp .env.example .env
nano .env
```

Isi:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=absen_app
DB_PASSWORD=PASSWORD_AMAN_ANDA
DB_NAME=absensiswaopencode
JWT_SECRET=<output dari openssl rand -base64 32>
NEXT_PUBLIC_API_URL=/api
```

---

### Langkah 8 — Sesuaikan koordinat sekolah

Ganti koordinat di dua file dengan lokasi asli SMKN 1 Arahan:

```bash
nano src/app/api/absensi/absen/route.ts      # baris 4-5
nano mobile/lib/location.ts                   # baris 3-4
```

---

### Langkah 9 — Install & build

```bash
npm install
npm run build
```

Pastikan output `✓ Compiled successfully` dan tidak ada error TypeScript.

---

### Langkah 10 — Jalankan dengan PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Test:

```bash
curl http://localhost:3000/api/server/waktu
```

Harus return JSON dengan `success: true`.

---

### Langkah 11 — Setup Nginx reverse proxy

Buat config:

```bash
sudo nano /etc/nginx/sites-available/absen-siswa
```

```nginx
server {
    listen 80;
    server_name DOMAIN_ATAU_IP_VPS;

    client_max_body_size 10M;

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
}
```

Aktifkan:

```bash
sudo ln -s /etc/nginx/sites-available/absen-siswa /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

### Langkah 12 — Verifikasi

Buka `http://IP_VPS` di browser:

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Wali Kelas | `wali_rpl1` | `wali123` |

Test API mobile:

```bash
curl -X POST http://localhost:3000/api/auth/login/siswa \
  -H "Content-Type: application/json" \
  -d '{"nisn":"10001","password":"siswa10001","device_id":"test"}'
```

---

### Langkah 13 — SSL HTTPS (opsional)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d DOMAIN_ANDA
```

---

### Langkah 14 — Build APK mobile

Setelah web jalan, ganti API URL di mobile app:

```bash
cd mobile
nano lib/api.ts   # ganti baris 1 ke https://DOMAIN_VPS/api
```

Install EAS CLI dan build:

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production
```

---

### Update app setelah ada perubahan kode

```bash
cd /opt/absen-siswa
git pull
npm install
npm run build
pm2 restart absen-siswa
```

---

### Troubleshooting

| Masalah | Solusi |
|---|---|
| App tidak konek DB | `mariadb -u absen_app -p absensiswaopencode` — test manual |
| Port 3000 dipakai | `sudo fuser -k 3000/tcp && pm2 restart absen-siswa` |
| Nginx 502 | `pm2 status` — pastikan status `online` |
| Reset device siswa | Web admin → Siswa → klik Reset Device, atau `sudo mariadb absensiswaopencode -e "UPDATE siswa SET device_id = NULL WHERE nisn='...'"` |
