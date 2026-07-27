# Panduan Deployment E-PIKPOR ke Vercel dan Aiven

Panduan ini berisi langkah-langkah detail untuk melakukan *deployment* aplikasi **E-PIKPOR** menggunakan **Aiven** (sebagai Database MySQL) dan **Vercel** (sebagai Hosting Backend Node.js & Frontend Statis).

---

## 1. Persiapan Database MySQL di Aiven

1. Buat akun dan login ke [Aiven Console](https://console.aiven.io/).
2. Klik **Create Service** dan pilih **MySQL**.
3. Pilih **Cloud Provider** (misal: AWS, GCP, atau DigitalOcean) dan **Region** terdekat (misal: `aws-ap-southeast-1` untuk Singapura / Jakarta jika tersedia).
4. Pilih **Service Plan** (Terdapat plan *Free/Hobbyist* untuk uji coba, atau pilih plan sesuai kebutuhan performa).
5. Beri nama layanan (misalnya: `e-pikpor-db`) dan klik **Create Service**.
6. Tunggu beberapa saat hingga statusnya **Running**.
7. Setelah berjalan, klik layanan tersebut dan masuk ke tab **Overview**. Catat informasi kredensial (Connection URI) berikut:
   - **Host**
   - **Port**
   - **User** (biasanya `avnadmin`)
   - **Password**
   - **Database Name** (biasanya `defaultdb`)

---

## 2. Penyesuaian Kode untuk Vercel

Vercel menggunakan lingkungan *Serverless*. Oleh karena itu, kita perlu melakukan beberapa penyesuaian pada source code lokal Anda:

### A. Ekspor Express App
Buka file `backend/server.js`. Scroll ke bagian paling bawah dan tambahkan baris berikut agar Vercel dapat mengekspor Express app sebagai fungsi *Serverless*:

```javascript
// Tambahkan di bagian paling bawah backend/server.js
module.exports = app;
```

### B. Konfigurasi `vercel.json`
Buat file baru bernama `vercel.json` di **root folder** E-PIKPOR (`c:\Users\kresnamukti\Documents\contoh saja 2\vercel.json`), kemudian isi dengan konfigurasi berikut:

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
    {
      "src": "/api/(.*)",
      "dest": "/backend/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ]
}
```
*Konfigurasi di atas akan merutekan semua request `/api/*` ke backend (Serverless Node), dan request lainnya ke frontend (Static HTML/JS).*

### C. Catatan Penting: Keterbatasan Upload File (Multer) di Vercel
> [!WARNING]
> Vercel menggunakan *ephemeral storage* (sistem file yang hanya bisa dibaca/read-only, kecuali folder `/tmp`). 
> Fitur upload gambar/file pada E-PIKPOR yang saat ini disimpan di folder `backend/uploads/` **tidak akan berfungsi atau filenya akan hilang** setelah beberapa saat di Vercel. 
> 
> **Solusi Jangka Panjang**: Untuk *production*, logika upload (`multer`) harus diubah untuk langsung mengunggah file ke Cloud Storage seperti **Cloudinary**, **AWS S3**, atau **Supabase Storage**.

---

## 3. Inisialisasi Database (Migrasi)

Karena database sekarang berada di Cloud (Aiven), Anda perlu membuat tabel-tabelnya (inisialisasi). Lakukan dari komputer lokal Anda:

1. Buka file `.env` di lokal Anda, ubah nilainya dengan kredensial dari Aiven:
   ```env
   DB_HOST=<Host Aiven>
   DB_USER=<User Aiven>
   DB_PASSWORD=<Password Aiven>
   DB_NAME=defaultdb
   DB_PORT=<Port Aiven>
   ```
2. Buka terminal/cmd di folder E-PIKPOR.
3. Jalankan perintah untuk membuat tabel:
   ```bash
   npm run init-db
   ```
4. Database Aiven sekarang sudah berisi tabel-tabel E-PIKPOR dan siap digunakan!

---

## 4. Proses Deployment ke Vercel

1. Pastikan Anda telah melakukan *commit* dan *push* semua perubahan (termasuk `vercel.json`) ke repositori **GitHub** Anda.
2. Buat akun / login ke [Vercel](https://vercel.com/) menggunakan akun GitHub.
3. Di dashboard Vercel, klik tombol **Add New...** lalu pilih **Project**.
4. Cari dan pilih repositori `E-PIKPOR` dari GitHub Anda, lalu klik **Import**.
5. Pada bagian **Configure Project**:
   - **Framework Preset**: Biarkan `Other`.
   - **Root Directory**: Biarkan default `./`.
   - **Build and Output Settings**: Tidak perlu diubah.
6. Pada bagian **Environment Variables**, tambahkan konfigurasi dari Aiven dan JWT:
   - Name: `DB_HOST`, Value: `<Host Aiven>`
   - Name: `DB_PORT`, Value: `<Port Aiven>`
   - Name: `DB_USER`, Value: `<User Aiven>`
   - Name: `DB_PASSWORD`, Value: `<Password Aiven>`
   - Name: `DB_NAME`, Value: `defaultdb`
   - Name: `JWT_SECRET`, Value: `secret_super_aman_anda`
7. Terakhir, klik tombol **Deploy**.
8. Tunggu proses *build* selesai. Setelah selesai, Vercel akan memberikan URL publik untuk mengakses aplikasi E-PIKPOR Anda secara *online*!

---

Selamat! Aplikasi E-PIKPOR Anda sekarang telah berhasil di-*deploy* menggunakan Vercel dan Aiven.
