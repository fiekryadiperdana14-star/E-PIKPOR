# 📘 Guide E-PIKPOR

> **Sistem Pelimpahan Data Tugas Lapangan Antar-Regu Piket Polrestabes Bandung**

---

## 📋 Daftar Isi

1. [Prasyarat (Prerequisites)](#-prasyarat-prerequisites)
2. [Instalasi & Menjalankan Aplikasi](#-instalasi--menjalankan-aplikasi)
3. [Username & Password Default](#-username--password-default)
4. [Deploy Gratis ke Internet](#-deploy-gratis-ke-internet)
   - [Opsi 1: Railway (Recommended)](#opsi-1-railway-recommended-)
   - [Opsi 2: Render](#opsi-2-render)
   - [Opsi 3: Vercel + PlanetScale](#opsi-3-vercel--planetscale)

---

## 🔧 Prasyarat (Prerequisites)

Sebelum memulai, pastikan perangkat kamu sudah terinstal:

| Software | Versi Minimum | Download |
|----------|--------------|----------|
| **Node.js** | v18+ | [nodejs.org](https://nodejs.org/) |
| **MySQL** | v8+ | [mysql.com](https://dev.mysql.com/downloads/installer/) |
| **Git** | Terbaru | [git-scm.com](https://git-scm.com/) |

> **💡 Tips:** Untuk Windows, kamu bisa install MySQL via **XAMPP** (download di [apachefriends.org](https://www.apachefriends.org/)) agar lebih mudah. Cukup nyalakan modul **MySQL** di XAMPP Control Panel.

---

## 🚀 Instalasi & Menjalankan Aplikasi

### Langkah 1: Clone atau Download Project

```bash
# Jika menggunakan Git:
git clone <URL_REPO_KAMU> e-pikpor
cd e-pikpor

# Atau extract file ZIP ke folder, lalu buka folder tersebut di terminal
```

### Langkah 2: Install Dependencies

```bash
npm install
```

### Langkah 3: Pastikan MySQL Berjalan

- Jika menggunakan **XAMPP**: Buka XAMPP Control Panel → Klik **Start** pada MySQL
- Jika menggunakan **MySQL standalone**: Pastikan MySQL service sudah running

### Langkah 4: Konfigurasi Environment (Opsional)

File `.env` sudah tersedia dengan konfigurasi default. Kamu bisa menyesuaikan jika perlu:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=e_pikpor_db
JWT_SECRET=rahasia_negara_epikpor_2026
```

> ⚠️ **Penting:** Jika MySQL kamu memiliki password, ubah `DB_PASSWORD` sesuai password MySQL kamu.

### Langkah 5: Inisialisasi Database

```bash
npm run init-db
```

Perintah ini akan:
- ✅ Membuat database `e_pikpor_db`
- ✅ Membuat tabel `users`, `reports`, dan `handovers`
- ✅ Menambahkan 3 user default (admin, danregu_a, danregu_b)

### Langkah 6: Jalankan Aplikasi

```bash
npm start
```

Jika berhasil, kamu akan melihat:

```
===========================================
  E-PIKPOR Server Running
  URL: http://localhost:3000
===========================================
```

### Langkah 7: Buka di Browser

Buka browser dan akses: **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Username & Password Default

Setelah menjalankan `npm run init-db`, sistem akan membuat 3 akun default:

| No | Username | Password | Role | Nama Regu |
|----|----------|----------|------|-----------|
| 1 | `admin` | `admin123` | **Admin** | Admin System |
| 2 | `danregu_a` | `regua123` | **Danregu** (Komandan Regu) | Regu A |
| 3 | `danregu_b` | `regub123` | **Danregu** (Komandan Regu) | Regu B |

### Penjelasan Role:

| Role | Hak Akses |
|------|-----------|
| **Admin** | Mengelola seluruh sistem, melihat semua data |
| **Danregu** | Membuat laporan, melimpahkan & menerima tugas antar-regu |
| **Anggota** | Membuat laporan tugas lapangan |

> ⚠️ **Keamanan:** Segera ubah password default setelah login pertama kali, terutama untuk akun admin!

---

## 🌐 Deploy Gratis ke Internet

Berikut 3 opsi deployment **100% GRATIS** untuk membuat aplikasi E-PIKPOR bisa diakses secara online:

---

### Opsi 1: Railway (Recommended) ⭐

**Railway** menyediakan hosting Node.js + MySQL gratis dengan setup yang sangat mudah.

#### Langkah-langkah:

**1. Buat akun Railway**
- Buka [railway.app](https://railway.app/)
- Daftar / login menggunakan akun **GitHub**

**2. Push project ke GitHub**
```bash
# Inisialisasi Git (jika belum)
git init

# Buat file .gitignore
echo node_modules/ > .gitignore
echo .env >> .gitignore
echo backend/uploads/ >> .gitignore

# Commit semua file
git add .
git commit -m "Initial commit E-PIKPOR"

# Hubungkan ke repository GitHub kamu
git remote add origin https://github.com/USERNAME/e-pikpor.git
git branch -M main
git push -u origin main
```

**3. Buat project baru di Railway**
- Klik **"New Project"** → **"Deploy from GitHub Repo"**
- Pilih repository `e-pikpor`

**4. Tambahkan MySQL**
- Di dashboard Railway, klik **"+ New"** → **"Database"** → **"MySQL"**
- Railway akan otomatis membuat database MySQL gratis

**5. Hubungkan variabel environment**

Klik service Node.js kamu → **Variables** → Tambahkan:

| Variable | Value |
|----------|-------|
| `PORT` | `3000` |
| `DB_HOST` | *(Salin dari MySQL service → `MYSQLHOST`)* |
| `DB_USER` | *(Salin dari MySQL service → `MYSQLUSER`)* |
| `DB_PASSWORD` | *(Salin dari MySQL service → `MYSQLPASSWORD`)* |
| `DB_NAME` | *(Salin dari MySQL service → `MYSQLDATABASE`)* |
| `JWT_SECRET` | `rahasia_negara_epikpor_2026` |

> 💡 **Tips:** Railway menyediakan variable `${{MySQL.MYSQLHOST}}` yang bisa langsung direferensikan.

**6. Inisialisasi database di Railway**

Di tab **Settings** → Custom Start Command:
```bash
node backend/init_db.js && node backend/server.js
```

> Ini akan menjalankan init_db dulu baru start server. Setelah deploy pertama sukses, ubah kembali ke:
> ```bash
> node backend/server.js
> ```

**7. Deploy!**
- Railway akan otomatis deploy. Tunggu hingga status **"Success"**
- Klik **"Generate Domain"** untuk mendapatkan URL publik (contoh: `e-pikpor-production.up.railway.app`)

#### ✅ Keunggulan Railway:
- Free tier: 500 jam/bulan, $5 credit gratis
- MySQL langsung tersedia
- Auto-deploy dari GitHub
- Custom domain support

---

### Opsi 2: Render

**Render** menawarkan hosting Node.js gratis + bisa dihubungkan dengan MySQL gratis dari pihak ketiga.

#### Langkah-langkah:

**1. Siapkan database MySQL gratis**

Gunakan **[Aiven](https://aiven.io/)** (Free tier MySQL):
- Daftar di [aiven.io](https://aiven.io/)
- Buat MySQL service → Pilih plan **Free**
- Catat: Host, Port, Username, Password, Database Name

**2. Push project ke GitHub** (sama seperti Opsi 1)

**3. Buat akun Render**
- Buka [render.com](https://render.com/)
- Daftar / login menggunakan akun **GitHub**

**4. Buat Web Service baru**
- Klik **"New +"** → **"Web Service"**
- Hubungkan repository GitHub `e-pikpor`
- Isi konfigurasi:

| Setting | Value |
|---------|-------|
| **Name** | `e-pikpor` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node backend/server.js` |
| **Instance Type** | `Free` |

**5. Tambahkan Environment Variables**

Di tab **Environment**, tambahkan:

| Key | Value |
|-----|-------|
| `DB_HOST` | *(dari Aiven)* |
| `DB_USER` | *(dari Aiven)* |
| `DB_PASSWORD` | *(dari Aiven)* |
| `DB_NAME` | *(dari Aiven)* |
| `JWT_SECRET` | `rahasia_negara_epikpor_2026` |

**6. Deploy**
- Render akan otomatis build dan deploy
- URL publik tersedia di: `e-pikpor.onrender.com`

#### ✅ Keunggulan Render:
- Free tier: 750 jam/bulan
- Auto-deploy dari GitHub
- Mudah digunakan

#### ⚠️ Kekurangan:
- Free tier akan "sleep" setelah 15 menit tidak ada traffic (cold start ~30 detik)
- MySQL harus dari layanan pihak ketiga

---

### Opsi 3: Vercel + PlanetScale

Opsi ini membutuhkan sedikit modifikasi kode karena Vercel menggunakan arsitektur **Serverless**.

#### Langkah-langkah:

**1. Database MySQL gratis**
- Gunakan **[Aiven](https://aiven.io/)** atau **[TiDB Serverless](https://tidbcloud.com/)** (kompatibel MySQL, free tier murah hati)

**2. Push project ke GitHub** (sama seperti Opsi 1)

**3. Buat akun Vercel**
- Buka [vercel.com](https://vercel.com/)
- Daftar / login menggunakan akun **GitHub**

**4. Buat file `vercel.json` di root project**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "frontend/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "backend/server.js" },
    { "src": "/(.*)", "dest": "frontend/$1" }
  ]
}
```

**5. Deploy**
- Import repository di Vercel dashboard
- Tambahkan environment variables
- Deploy!

#### ✅ Keunggulan Vercel:
- Free tier sangat murah hati
- Performa CDN global sangat cepat
- Auto-deploy dari GitHub

#### ⚠️ Kekurangan:
- Perlu modifikasi kode untuk Serverless architecture
- File uploads tidak persistent (perlu cloud storage seperti Cloudinary)
- Lebih kompleks untuk setup awal

---

## 📊 Perbandingan Opsi Deployment

| Fitur | Railway ⭐ | Render | Vercel |
|-------|-----------|--------|--------|
| **Kemudahan Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **MySQL Built-in** | ✅ Ya | ❌ Perlu Aiven | ❌ Perlu Aiven/TiDB |
| **File Upload** | ✅ Persistent | ✅ Persistent | ❌ Perlu Cloud Storage |
| **Cold Start** | ❌ Tidak ada | ⚠️ ~30 detik | ❌ Tidak ada |
| **Free Tier** | $5 credit/bulan | 750 jam/bulan | 100GB bandwidth |
| **Custom Domain** | ✅ Gratis | ✅ Gratis | ✅ Gratis |

> 🏆 **Rekomendasi:** Gunakan **Railway** untuk pengalaman deployment paling mudah dan lengkap. MySQL langsung tersedia tanpa perlu setup tambahan.

---

## ❓ Troubleshooting

### ❌ Error: `ER_ACCESS_DENIED_ERROR`
**Penyebab:** Password MySQL tidak sesuai.
**Solusi:** Ubah `DB_PASSWORD` di file `.env` sesuai password MySQL kamu.

### ❌ Error: `ECONNREFUSED`
**Penyebab:** MySQL belum berjalan.
**Solusi:** Nyalakan MySQL (start service atau buka XAMPP → Start MySQL).

### ❌ Error: `ER_BAD_DB_ERROR`
**Penyebab:** Database belum dibuat.
**Solusi:** Jalankan `npm run init-db` terlebih dahulu.

### ❌ Port 3000 sudah dipakai
**Solusi:** Ubah `PORT` di file `.env` ke port lain, misalnya `3001`.

---

## 📞 Kontak & Bantuan

Jika mengalami kendala, silakan hubungi tim pengembang atau buka issue di repository GitHub project ini.

---

> 📅 **Terakhir diperbarui:** Juni 2026
