# Deploy Absensi SMKN 1 Arahan ke VPS

## 1. Siapkan VPS

### Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Install MariaDB
```bash
sudo apt install -y mariadb-server
sudo mysql_secure_installation
```

### Install PM2 & Nginx
```bash
sudo npm install -g pm2
sudo apt install -y nginx
```

## 2. Setup Database

```bash
sudo mariadb < src/lib/migration.sql
```

Lalu buat user untuk aplikasi:
```sql
CREATE USER 'absen_app'@'localhost' IDENTIFIED BY 'password_aman';
GRANT ALL PRIVILEGES ON absensiswaopencode.* TO 'absen_app'@'localhost';
FLUSH PRIVILEGES;
```

## 3. Deploy Aplikasi

```bash
# Copy project ke VPS
git clone <repo-url> /opt/absen-siswa
cd /opt/absen-siswa

# Setup environment
cp .env.example .env
# Edit .env dengan kredensial VPS:
#   DB_HOST=localhost
#   DB_USER=absen_app
#   DB_PASSWORD=password_aman
#   DB_NAME=absensiswaopencode
#   JWT_SECRET=<random-string>
#   NEXT_PUBLIC_API_URL=/api

# Install & build
npm install
npm run build

# Start with PM2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## 4. Setup Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name absensi.smkn1arahan.sch.id;  # sesuaikan domain

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

```bash
sudo ln -s /etc/nginx/sites-available/absen-siswa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 5. Mobile App API URL

Build APK dengan `API_BASE` mengarah ke domain VPS:

Edit `mobile/lib/api.ts`:
```ts
const API_BASE = "https://absensi.smkn1arahan.sch.id/api"
```

Lalu build APK:
```bash
cd mobile
npx eas build --platform android --profile production
```

## 6. Koordinat Sekolah

Ubah koordinat di:
- `src/app/api/absensi/absen/route.ts` baris 4-5
- `mobile/lib/location.ts` baris 3-4

Setelah ubah, rebuild:
```bash
npm run build
pm2 restart absen-siswa
```
