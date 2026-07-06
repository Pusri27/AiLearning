# Panduan Lengkap Deployment Lumina Monorepo (Harin Learning)

Panduan ini akan membimbing Anda langkah-demi-langkah untuk mendeploy aplikasi Lumina Monorepo ke **Vercel** (untuk Frontend) dan **Supabase** (untuk Backend/Database) menggunakan **GitHub**.

---

## Ringkasan Arsitektur Proyek
* **Frontend**: React + Vite (berada di folder `apps/dashboard`).
* **Backend**: Supabase (Database PostgreSQL, Authentication, & Storage) + OpenRouter API (untuk fitur kecerdasan buatan/AI).
* **Struktur Kode**: Monorepo npm workspaces.

---

## Langkah 1: Persiapan & Setup Backend (Supabase)

Aplikasi Anda menggunakan Supabase sebagai backend serverless. Ikuti langkah berikut untuk mengonfigurasinya:

1. **Buat Proyek Baru di Supabase**:
   * Buka [Supabase Dashboard](https://supabase.com/) dan buat proyek baru.
   * Catat **Database Password** Anda. Setelah proyek siap, masuk ke bagian **Project Settings > API** untuk mendapatkan **Project URL** dan **Anon Key** (API Key).

2. **Inisialisasi Tabel Database (PENTING)**:
   * Buka menu **SQL Editor** di dashboard Supabase Anda.
   * Klik **New Query**.
   * Salin seluruh isi berkas dari proyek lokal Anda yang berada di:
     `apps/dashboard/src/lib/FULL_SETUP.sql`
     *(Berkas ini adalah gabungan lengkap dari semua skema tabel, keamanan RLS, RPC, chat, komunitas, dan realtime yang sudah saya optimalkan agar bebas error saat dijalankan di Supabase).*
   * Tempelkan kode SQL tersebut ke dalam SQL Editor Supabase, lalu klik **Run**. Ini akan membuat seluruh tabel yang dibutuhkan secara aman.

3. **Buat Storage Bucket**:
   Aplikasi Anda memerlukan tempat penyimpanan berkas (foto profil & materi):
   * Masuk ke menu **Storage** di dashboard Supabase.
   * Buat bucket baru dengan nama **`avatars`** dan pastikan mencentang opsi **Public bucket**.
   * Buat bucket kedua dengan nama **`syllabus_files`** (juga dicentang **Public bucket**).
   *(Kebijakan keamanan/Policy untuk storage sudah otomatis dikonfigurasi lewat berkas `FULL_SETUP.sql` di atas).*

4. **Menjalankan Seed Data (Opsional tapi Direkomendasikan)**:
   Untuk mengisi database baru Anda dengan data contoh (kursus, postingan blog, dll.), jalankan perintah seed dari komputer lokal Anda:
   * Edit berkas `.env` di `apps/dashboard/.env` terlebih dahulu untuk menghubungkan ke Supabase baru Anda (gunakan kunci `SUPABASE_SERVICE_ROLE_KEY` dan `VITE_SUPABASE_URL`).
   * Jalankan perintah berikut di terminal Anda pada direktori root proyek:
     ```bash
     # Masuk ke direktori dashboard
     cd apps/dashboard
     # Jalankan skrip seed database
     npm run seed
     npm run seed:blog
     ```

---

## Langkah 2: Mengunggah Kode ke GitHub

Vercel akan terhubung langsung dengan GitHub agar setiap kali Anda melakukan `git push`, aplikasi Anda akan langsung terupdate secara otomatis.

1. **Inisialisasi Git Lokal** (jika belum):
   Buka terminal di root direktori `/Users/pusri/Documents/AiLearning` dan jalankan:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Lumina Monorepo"
   ```

2. **Buat Repositori di GitHub**:
   * Buka [GitHub](https://github.com/) dan buat repositori baru (bisa Private atau Public).
   * Jangan centang opsi "Add a README", "Add .gitignore", atau "Choose a license" karena proyek Anda sudah memilikinya.

3. **Hubungkan & Push Kode Anda**:
   Ikuti instruksi GitHub untuk menghubungkan repositori lokal Anda:
   ```bash
   # Ganti URL di bawah dengan URL repositori GitHub Anda
   git remote add origin https://github.com/USERNAME/NAMA-REPOSITORI.git
   git branch -M main
   git push -u origin main
   ```

---

## Langkah 3: Mendeploy Frontend ke Vercel

Karena aplikasi ini menggunakan struktur **Monorepo** dengan `npm workspaces` di mana frontend berada di `apps/dashboard`, ikuti konfigurasi Vercel di bawah ini dengan teliti agar proses kompilasi berjalan lancar.

1. **Masuk ke Vercel**:
   * Buka [Vercel Dashboard](https://vercel.com/) dan masuk menggunakan akun GitHub Anda.

2. **Impor Proyek Baru**:
   * Klik tombol **Add New...** -> **Project**.
   * Pilih repositori GitHub Anda yang baru saja diunggah, lalu klik **Import**.

3. **Konfigurasi Pengaturan Proyek (Project Settings)**:
   Sebelum mengklik *Deploy*, sesuaikan pengaturan berikut:
   
   * **Framework Preset**: Pilih `Vite` (Vercel biasanya mendeteksi ini secara otomatis).
   * **Root Directory**: Klik *Edit* dan pilih folder **`apps/dashboard`**.
     > **Info Penting:** Dengan memilih `apps/dashboard` sebagai Root Directory, Vercel akan otomatis mengenali struktur monorepo Anda. Vercel akan membaca `package-lock.json` di root proyek untuk menginstal dependensi dengan cepat dan efisien.

4. **Konfigurasi Build & Development Settings** (Buka dropdown ini):
   * Pastikan konfigurasinya sebagai berikut (secara bawaan akan otomatis terisi):
     * **Build Command**: `vite build` atau `npm run build`
     * **Output Directory**: `dist`
     * **Install Command**: `npm install` (Vercel akan menjalankan ini dari root monorepo secara pintar).

---

## Langkah 4: Memasukkan Variabel Lingkungan (Environment Variables)

Pada bagian **Environment Variables** di halaman konfigurasi Vercel tersebut, tambahkan kunci-kunci berikut yang diambil dari berkas `.env` Anda:

| Key (Nama Variabel) | Value (Nilai) | Penjelasan / Sumber |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` | URL Supabase Anda (dari Project Settings > API) |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1...` | Anon Key Supabase Anda (dari Project Settings > API) |
| `VITE_OPENROUTER_API_KEY` | `sk-or-v1-f76b23...` | API Key dari OpenRouter untuk kebutuhan AI |
| `VITE_AI_MODEL` | `google/gemini-2.5-flash` | Model AI yang ingin digunakan (opsional, sesuaikan nilai) |

> **PERINGATAN PENTING:**
> 1. Jangan masukkan `SUPABASE_SERVICE_ROLE_KEY` ke Vercel! Kunci ini memiliki hak akses penuh (*bypass* RLS) dan sangat berbahaya jika terungkap ke sisi klien/browser.
> 2. Variabel lingkungan di Vite wajib diawali dengan awalan **`VITE_`** agar dapat diakses oleh kode frontend React Anda via `import.meta.env.VITE_...`. Jika tidak diawali `VITE_`, nilainya akan bernilai `undefined` setelah dideploy.

---

## Langkah 5: Jalankan Deployment & Pengujian

1. **Klik Deploy**:
   * Setelah semua konfigurasi dan variabel lingkungan dimasukkan, klik tombol **Deploy**.
   * Tunggu sekitar 1-3 menit untuk proses kompilasi. Vercel akan memberikan tautan domain gratis (contoh: `https://lumina-monorepo.vercel.app`).

2. **Konfigurasi Redirect URL untuk Supabase Auth** (PENTING untuk Login/Signup):
   Agar pengguna Anda dapat login kembali ke aplikasi setelah proses otentikasi (seperti konfirmasi email atau Google Sign-In):
   * Masuk ke **Supabase Dashboard > Authentication > URL Configuration**.
   * Di bagian **Site URL**, masukkan domain Vercel Anda (contoh: `https://nama-proyek-anda.vercel.app`).
   * Di bagian **Redirect URLs**, tambahkan `https://nama-proyek-anda.vercel.app/**` agar semua proses pengalihan kembali berjalan lancar.

---

## Troubleshooting / Masalah yang Sering Terjadi

### 1. Masalah Routing (Error 404 ketika Refresh Halaman)
React Router menggunakan client-side routing. Jika Anda memuat ulang halaman selain homepage (misal `/courses` atau `/dashboard`), Vercel akan mengembalikan error 404.
* **Solusi**: Buat berkas baru bernama `vercel.json` di dalam folder `apps/dashboard/` dengan isi berikut:
  ```json
  {
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```
  Lahu push berkas tersebut ke GitHub. Vercel akan melakukan re-build secara otomatis dan mengatasi masalah 404 ini.

### 2. Variabel Lingkungan Bernilai `undefined`
Jika fitur AI atau Supabase tidak berfungsi dan Anda melihat log error API Key di konsol browser.
* **Solusi**: Periksa kembali nama variabel lingkungan di pengaturan Vercel. Pastikan namanya persis sama dengan yang ada di berkas `.env` lokal Anda (termasuk awalan `VITE_`).

### 3. Masalah CORS pada API OpenRouter
Aplikasi memanggil API OpenRouter langsung dari sisi client browser. Terkadang ini bisa terhambat kebijakan keamanan atau limitasi.
* **Solusi**: Jika terjadi kendala CORS jangka panjang, direkomendasikan untuk memindahkan pemanggilan API OpenRouter ke *Serverless Functions* bawaan Vercel (folder `/api`) agar dipanggil dari server-side. Namun untuk saat ini, pemanggilan langsung menggunakan `fetch` dari browser dengan header yang benar sudah didukung secara resmi oleh OpenRouter.

### 4. Error: Cannot find native binding (@rolldown/binding-linux-x64-gnu)
Vite versi baru menggunakan compiler Rolldown yang butuh binary native khusus untuk OS server Vercel (Linux x64). Jika lockfile Anda digenerate di macOS, Vercel terkadang gagal mendownload library Linux ini secara otomatis karena bug package manager (NPM).
* **Solusi**: Saya sudah menambahkan `@rolldown/binding-linux-x64-gnu` ke dalam `optionalDependencies` di `apps/dashboard/package.json` dan memperbarui `package-lock.json` lokal Anda. 
* **Langkah Anda**: Anda cukup melakukan git commit dan push perubahan terbaru ini ke GitHub Anda:
  ```bash
  git add apps/dashboard/package.json package-lock.json
  git commit -m "fix: add rolldown linux binding optional dependency"
  git push
  ```
  Vercel akan otomatis melakukan build ulang dan error ini akan hilang.

