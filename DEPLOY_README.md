# Panduan Deployment Gratis RBT Simulation

Dokumen ini berisi panduan teknis langkah demi langkah untuk melakukan deployment (publikasi) aplikasi RBT Simulation secara **gratis 100%** menggunakan berbagai layanan *PaaS (Platform as a Service)* dan *DBaaS (Database as a Service)* yang menyediakan *Free Tier*.

Skema layanan yang akan digunakan:
1. **Database (MySQL)**: Aiven (Free Plan)
2. **Backend (Node.js/Express)**: Render (Free Web Service)
3. **Frontend (Angular)**: Vercel (Hobby Plan)

---

## 1. Persiapan Basis Data MySQL (Aiven)

Kita akan menggunakan **Aiven** karena menyediakan layanan MySQL gratis yang stabil.

1. Buka [Aiven.io](https://aiven.io/) dan buat akun gratis.
2. Di konsol Aiven, klik **Create Service**.
3. Pilih layanan **MySQL**.
4. Pilih Cloud Provider (misalnya Google Cloud atau AWS) dan region yang paling dekat, seperti `ap-southeast-1` (Singapura).
5. Pilih **Service Plan: Free**.
6. Klik **Create Service**.
7. Tunggu beberapa menit hingga statusnya berubah menjadi *Running*.
8. Anda akan mendapatkan **Connection URI** atau detail koneksi (Host, Port, User, Password).
9. Buat sebuah database baru (misalnya: `rbt_simulation`) melalui dashboard Aiven.
10. **Migrasi Schema:** 
    Gunakan tools seperti *DBeaver*, *HeidiSQL*, atau *TablePlus* untuk terhubung ke database Aiven Anda, lalu jalankan seluruh isi file `c:\Users\kresnamukti\Documents\contoh saja\rbt-backend\database\migrations\001_init.sql` untuk membuat tabel yang dibutuhkan.

---

## 2. Deployment Backend (Render)

Kita akan men-deploy backend Express.js ke **Render**.

### Persiapan File Repository
Pastikan folder `rbt-backend` dan `rbt-frontend` sudah di-push ke sebuah repositori di akun GitHub/GitLab Anda.

1. Buka [Render.com](https://render.com/) dan buat/masuk ke akun Anda.
2. Klik **New** -> **Web Service**.
3. Pilih "Build and deploy from a Git repository" dan hubungkan akun GitHub Anda. Pilih repositori proyek ini.
4. Isi konfigurasi berikut:
   - **Name**: `rbt-backend-api` (bebas)
   - **Root Directory**: `rbt-backend` *(Sangat penting karena repo berbentuk monorepo)*
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/app.js` (Atau `npm start` jika sudah diset di package.json)
5. Gulir ke bawah ke bagian **Environment Variables**. Tambahkan variabel yang sama persis dengan `.env` lokal Anda:
   - `PORT` = `3000`
   - `NODE_ENV` = `production`
   - `DB_HOST` = *(Host dari Aiven)*
   - `DB_PORT` = *(Port dari Aiven)*
   - `DB_USER` = *(User dari Aiven)*
   - `DB_PASSWORD` = *(Password dari Aiven)*
   - `DB_NAME` = `rbt_simulation` (Nama DB yang Anda buat di Aiven)
   - `GOOGLE_CLIENT_ID` = *(Sesuai .env)*
   - `GOOGLE_CLIENT_SECRET` = *(Sesuai .env)*
   - `JWT_SECRET` = *(Gunakan secret acak yang kuat)*
   - `JWT_EXPIRES_IN` = `24h`
   - `PASAL_API_BASE_URL` = `https://pasal.id/api/v1`
   - `PASAL_API_TOKEN` = *(Token Pasal.id Anda)*
   - `GEMINI_API_KEY` = *(API Key Gemini Anda)*
   - `FRONTEND_URL` = *(Nantinya diisi URL Vercel. Untuk sementara isi sembarang URL)*
6. Pilih plan **Free**, lalu klik **Create Web Service**.
7. Tunggu build selesai. Render akan memberikan URL backend Anda (contoh: `https://rbt-backend-api.onrender.com`).
   *Catatan: Web service gratis di Render akan "tertidur" jika tidak ada aktivitas selama 15 menit, request pertama setelahnya akan memakan waktu 30-50 detik untuk merespons.*

---

## 3. Deployment Frontend (Vercel)

Kita akan men-deploy aplikasi Angular ke **Vercel**.

### Persiapan Konfigurasi Environment Angular
Vercel membutuhkan URL backend untuk dikomunikasikan di produksi.
1. Buka file `rbt-frontend/src/environments/environment.prod.ts`.
2. Ubah `apiUrl` menjadi URL Backend Render Anda, dan jangan lupa masukkan `googleClientId`.
    ```typescript
    export const environment = {
      production: true,
      apiUrl: 'https://rbt-backend-api.onrender.com/api',
      googleClientId: '524217930424-86b3ejd1dg72phidu614ihdbago63tlo.apps.googleusercontent.com'
    };
    ```
3. Commit dan Push perubahan ini ke GitHub Anda.

### Deployment ke Vercel
1. Buka [Vercel.com](https://vercel.com/) dan buat/masuk ke akun Anda.
2. Klik **Add New...** -> **Project**.
3. Import repositori GitHub Anda.
4. Di bagian pengaturannya, atur sebagai berikut:
   - **Framework Preset**: Auto-detect akan memilih Angular. Pastikan ia memilih `Angular`.
   - **Root Directory**: Klik tulisan *Edit*, lalu pilih direktori `rbt-frontend`.
   - Buka menu drop-down **Build and Output Settings** (biarkan default jika sudah tepat):
     - Build Command: `ng build`
     - Output Directory: `dist/rbt-frontend/browser` (Pada Angular 19, hasil build ada di dalam folder `/browser`. Pastikan ini sesuai. Bisa juga `dist/rbt-frontend`).
5. Klik **Deploy**.
6. Tunggu hingga proses build selesai. Vercel akan memberikan Anda URL frontend (contoh: `https://rbt-frontend.vercel.app`).

---

## 4. Konfigurasi Akhir (Sangat Penting)

### 1. Update variabel FRONTEND_URL di Render
1. Buka dashboard Render Web Service Backend Anda.
2. Buka tab **Environment**.
3. Ubah value dari `FRONTEND_URL` menjadi URL Vercel Anda: `https://rbt-frontend.vercel.app`. Sengaja tanpa garis miring (`/`) di belakangnya.
4. Simpan, dan aplikasi backend akan ter-deploy ulang secara otomatis agar CORS mengizinkan Vercel Anda.

### 2. Update Google OAuth Client di Google Cloud Console
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Arahkan ke **APIs & Services** > **Credentials**.
3. Edit Client ID OAuth 2.0 Web Application milik Anda.
4. Pada **Authorized JavaScript origins**, tambahkan URL Vercel Anda (contoh: `https://rbt-frontend.vercel.app`).
5. Pada **Authorized redirect URIs**, tambahkan URL backend Render Anda (opsional jika dibutuhkan, tapi untuk frontend Google Sign-In biasanya cukup JavaScript origins saja).
6. Simpan perubahan.

### Selamat 🎉
Aplikasi RBT Simulation Anda kini telah ter-deploy sepenuhnya! Anda dapat membagikan URL Vercel kepada instruktur (Gadik) dan peserta Prolat untuk digunakan.
