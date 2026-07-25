<div align="center">

# 🎓 AiLearning (Lumina Monorepo)

**Next-Generation AI-Powered Interactive E-Learning & LMS Platform**

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-AI%20Integration-7400B8?style=for-the-badge&logo=openai)](https://openrouter.ai/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

[Fitur Utama](#-fitur-utama) • [Teknologi](#-teknologi--arsitektur) • [Struktur Proyek](#-struktur-proyek) • [Cara Instalasi](#-cara-instalasi--penggunaan) • [Panduan Deployment](#-deployment)

</div>

---

## 📌 Ringkasan Proyek

**AiLearning (Lumina)** adalah platform Learning Management System (LMS) modern berbasis web yang mengintegrasikan **Kecerdasan Buatan (AI)** untuk menghadirkan pengalaman belajar yang personal, interaktif, dan imersif. 

Dikembangkan dengan arsitektur monorepo, platform ini menyediakan ekosistem lengkap baik untuk **Siswa (Learner)** dalam mempelajari materi dan tugas coding interaktif, maupun untuk **Pengajar (Instructor)** dalam mengelola kursus, menganalisis perkembangan siswa, dan menerbitkan konten edukasi.

---

## ✨ Fitur Utama

### 👨‍🎓 Mode Siswa (Learner Experience)
- 🚀 **Interactive Course Player**: Navigasi materi fleksibel dengan dukungan video, dokumen markdown, serta **Interactive Code Editor** langsung di browser.
- 🤖 **AI Study Space & Tutor**: Pendamping belajar AI bawaan (powered by OpenRouter) untuk menjawab pertanyaan, menjelaskan kode, dan memberikan bantuan studi 24/7.
- 🏆 **Gamifikasi & Daily Challenge**: Sistem tantangan harian, perolehan XP, badge pencapaian (*Achievements*), dan pelacakan *Learning Streak*.
- 💬 **Komunitas & Blog Feed**: Ruang diskusi interaktif, publikasi artikel/blog, serta berbagi pengalaman antar sesama pelajar.
- 🛒 **Katalog & Pembelian Kursus**: Fitur keranjang (*Cart*) dan proses *Checkout* kursus yang intuitif.

### 👨‍🏫 Mode Pengajar (Instructor Studio)
- 📊 **Teacher Analytics & Dashboard**: Monitor total siswa, pendapatan, performa kursus, serta grafik aktivitas pengajaran.
- 📝 **Advanced Course Builder**: Maker/Editor kursus komprehensif lengkap dengan manajemen modul, penyusunan silabus, dan *Rich Description Editor*.
- 👥 **Manajemen Siswa & Aktivitas**: Pantau progres masing-masing siswa yang terdaftar pada kursus.

### 🔒 Keamanan & Infrastruktur
- 🛡️ **Supabase Authentication**: Login/Register aman dengan enkripsi password dan manajemen sesi.
- 🔐 **Row-Level Security (RLS)**: Proteksi data tingkat baris di PostgreSQL untuk menjamin privasi data antar pengguna.
- 📁 **Cloud File Storage**: Manajemen berkas publik/privat untuk avatar profil dan materi silabus.

---

## 🛠️ Teknologi & Arsitektur

Platform ini dibangun menggunakan teknologi *cutting-edge* untuk memastikan performa tinggi dan skala yang mudah:

| Kategori | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite 8 | UI framework ultra-cepat dengan React Router v7 |
| **Styling** | Tailwind CSS v4 | Utility-first CSS framework untuk tampilan responsif & modern |
| **Backend & DB** | Supabase (PostgreSQL) | Database relasional, Realtime subscriptions, Auth & Storage |
| **AI Integration** | OpenRouter API | Integrasi LLM untuk tutor interaktif & asisten kecerdasan buatan |
| **Monorepo** | npm Workspaces | Pengelolaan dependensi & aplikasi terpusat |
| **Icons & Effects** | Lucide Icons, Canvas Confetti | Ikonografi modern dan efek animasi interaktif |

---

## 📁 Struktur Proyek

```
AiLearning/
├── apps/
│   └── dashboard/                  # Aplikasi Utama React + Vite
│       ├── public/                 # Asset statis
│       ├── scripts/                # Skrip seeder database & maintenance
│       │   ├── seed.js             # Seeder data kursus & materi
│       │   ├── seed_blog.js        # Seeder artikel blog
│       │   └── keep-alive.js       # Maintenance script
│       └── src/
│           ├── assets/             # Gambar & ikon bawaan
│           ├── components/         # Komponen UI reusable (Navbar, Sidebar, Modal, dll)
│           ├── context/            # Context API (Auth, Theme, App State)
│           ├── lib/                # Konfigurasi Supabase, OpenRouter API, & FULL_SETUP.sql
│           └── pages/              # Halaman Siswa & Pengajar (30+ Halaman)
├── DEPLOYMENT_GUIDE.md             # Panduan deployment lengkap ke Vercel & Supabase
├── package.json                    # Root monorepo workspace configuration
└── README.md                       # Dokumentasi resmi proyek
```

---

## 🚀 Cara Instalasi & Penggunaan

### 📋 Prasyarat
- **Node.js** >= v18.0.0
- **npm** >= v9.0.0
- Akun **Supabase** & Akun **OpenRouter** (Opsional untuk AI features)

### 1️⃣ Clone Repositori
```bash
git clone https://github.com/Pusri27/AiLearning.git
cd AiLearning
```

### 2️⃣ Instal Dependensi
```bash
npm install
```

### 3️⃣ Konfigurasi Environment Variables
Buat berkas `.env` di folder `apps/dashboard/.env` dan isi variabel berikut:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_OPENROUTER_API_KEY=your-openrouter-api-key
```

### 4️⃣ Setup Database (Supabase)
1. Buka **SQL Editor** di Supabase Dashboard Anda.
2. Eksekusi skrip SQL dari `apps/dashboard/src/lib/FULL_SETUP.sql`.
3. Buat dua Storage Bucket di Supabase Storage: `avatars` (Public) dan `syllabus_files` (Public).
4. Jalankan seeder data (opsional):
   ```bash
   cd apps/dashboard
   npm run seed
   npm run seed:blog
   ```

### 5️⃣ Jalankan Aplikasi (Development Mode)
Dari root direktori proyek, jalankan:
```bash
npm run dev
```
Aplikasi akan berjalan di `http://localhost:5173`.

---

## 🌐 Deployment

Panduan langkah-demi-langkah lengkap untuk mendeploy aplikasi ini ke **Vercel** (Frontend) dan **Supabase** (Backend) dapat dilihat di berkas **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**.

---

## 📜 Lisensi

Proyek ini dilindungi di bawah lisensi [MIT License](LICENSE).

---

<div align="center">
  <sub>Dibuat dengan ❤️ oleh <b>Natade / Pusri</b></sub>
</div>
