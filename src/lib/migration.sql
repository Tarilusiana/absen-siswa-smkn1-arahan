-- Database: absensiswaopencode
-- Jalankan script ini di MariaDB untuk membuat struktur database
-- Gunakan: sudo mariadb < src/lib/migration.sql
-- Atau manual: sudo mariadb absensiswaopencode < src/lib/migration.sql

-- CREATE DATABASE IF NOT EXISTS absensiswaopencode;
-- USE absensiswaopencode;

-- Tabel Kelas
CREATE TABLE IF NOT EXISTS kelas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(50) NOT NULL UNIQUE,
    tingkat INT NOT NULL,
    jurusan VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabel Siswa
CREATE TABLE IF NOT EXISTS siswa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nisn VARCHAR(20) NOT NULL UNIQUE,
    nama VARCHAR(200) NOT NULL,
    id_kelas INT NOT NULL,
    password VARCHAR(255) NOT NULL DEFAULT 'siswa123',
    device_id VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_kelas) REFERENCES kelas(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Tabel Wali Kelas (User)
CREATE TABLE IF NOT EXISTS wali_kelas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama VARCHAR(200) NOT NULL,
    id_kelas INT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_kelas) REFERENCES kelas(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Tabel Admin
CREATE TABLE IF NOT EXISTS admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabel Absensi
CREATE TABLE IF NOT EXISTS absensi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_siswa INT NOT NULL,
    tanggal DATE NOT NULL,
    jam_masuk TIME DEFAULT NULL,
    jam_pulang TIME DEFAULT NULL,
    status ENUM('H', 'S', 'I', 'A', 'T') NOT NULL DEFAULT 'A',
    keterangan VARCHAR(500) DEFAULT NULL,
    diubah_oleh VARCHAR(200) DEFAULT NULL,
    diubah_pada TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_absensi (id_siswa, tanggal),
    FOREIGN KEY (id_siswa) REFERENCES siswa(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========================
-- SEED DATA (opsional)
-- Uncomment dan jalankan setelah import tabel
-- ========================

-- INSERT INTO admin (username, password, nama) VALUES ('admin', 'admin123', 'Administrator');
-- INSERT INTO kelas (nama, tingkat, jurusan) VALUES ('X RPL 1', 10, 'RPL'), ('X TKJ 1', 10, 'TKJ');
-- INSERT INTO siswa (nisn, nama, id_kelas, password) VALUES ('10001', 'Ahmad Fauzi', 1, 'siswa10001');
-- INSERT INTO wali_kelas (username, password, nama, id_kelas) VALUES ('wali_rpl1', 'wali123', 'Bpk. Supriyadi', 1);
