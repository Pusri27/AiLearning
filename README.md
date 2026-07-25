<div align="center">

# 🎓 Harin (AiLearning Platform)

**Next-Generation AI-Powered Interactive E-Learning & LMS Platform**

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-AI%20Integration-7400B8?style=for-the-badge&logo=openai)](https://openrouter.ai/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

[Features](#-key-features) • [Tech Stack](#-tech-stack--architecture) • [Project Structure](#-project-structure) • [Getting Started](#-getting-started) • [Deployment](#-deployment)

</div>

---

## 📌 Project Overview

**Harin (AiLearning)** is a state-of-the-art web-based Learning Management System (LMS) that seamlessly integrates **Artificial Intelligence (AI)** to deliver personalized, interactive, and immersive educational experiences.

Built with a scalable monorepo architecture, Harin provides a complete ecosystem tailored for both **Learners**—who can engage with rich course materials and live in-browser coding exercises—and **Instructors**, who are equipped with tools to build courses, monitor student analytics, and publish educational content.

---

## ✨ Key Features

### 👨‍🎓 Learner Experience
- 🚀 **Interactive Course Player**: Flexible module navigation featuring video lessons, Markdown documents, and an **Interactive Code Editor** directly in the browser.
- 🤖 **AI Study Space & Tutor**: Built-in AI learning assistant (powered by OpenRouter) for instant Q&A, code explanations, concept breakdowns, and 24/7 study guidance.
- 🏆 **Gamification & Daily Challenges**: Daily learning tasks, XP rewards, achievement badges, and **Learning Streak** tracking to boost engagement.
- 💬 **Community & Discussion Hub**: Interactive forum, rich blog/article publishing, and social feed for peer-to-peer collaboration.
- 🛒 **Course Catalog & Checkout**: Intuitive course discovery, shopping cart, and smooth checkout flow.

### 👨‍🏫 Instructor Studio
- 📊 **Teacher Analytics & Dashboard**: Real-time insights into total enrollments, revenue stats, course performance, and student engagement graphs.
- 📝 **Advanced Course Builder**: Comprehensive course creator supporting module structure, syllabus management, and rich media content editors.
- 👥 **Student & Activity Management**: Track individual student progress across published courses.

### 🔒 Security & Infrastructure
- 🛡️ **Supabase Authentication**: Secure user login/registration with encrypted passwords and session management.
- 🔐 **Row-Level Security (RLS)**: PostgreSQL row-level data protection ensuring strict data isolation across accounts.
- 📁 **Cloud Storage Buckets**: Public/private file handling for user profiles and course assets.

---

## 🛠️ Tech Stack & Architecture

Harin leverages modern technologies designed for optimal performance, developer experience, and scalability:

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite 8 | Ultra-fast UI library coupled with React Router v7 |
| **Styling** | Tailwind CSS v4 | Utility-first CSS framework for modern, responsive layouts |
| **Backend & DB** | Supabase (PostgreSQL) | Relational database, Realtime subscriptions, Auth & Storage |
| **AI Integration** | OpenRouter API | Multi-model LLM integration for AI tutoring & smart assistance |
| **Monorepo** | npm Workspaces | Centralized dependency management and workspace scripts |
| **Icons & FX** | Lucide Icons, Canvas Confetti | Modern icon set and interactive visual feedback |

---

## 📁 Project Structure

```
AiLearning/
├── apps/
│   └── dashboard/                  # Primary React + Vite Application
│       ├── public/                 # Static assets
│       ├── scripts/                # Database seeders & maintenance scripts
│       │   ├── seed.js             # Course & material seeding
│       │   ├── seed_blog.js        # Blog article seeding
│       │   └── keep-alive.js       # Database ping script
│       └── src/
│           ├── assets/             # Branding & visual assets
│           ├── components/         # Reusable UI components (Navbar, Sidebar, Modals, etc.)
│           ├── context/            # Global React Contexts (Auth, Theme, App State)
│           ├── lib/                # Supabase client, OpenRouter helpers & FULL_SETUP.sql
│           └── pages/              # Learner & Instructor views (30+ pages)
├── DEPLOYMENT_GUIDE.md             # Step-by-step deployment guide for Vercel & Supabase
├── package.json                    # Root monorepo workspace configuration
└── README.md                       # Official project documentation
```

---

## 🚀 Getting Started

### 📋 Prerequisites
- **Node.js** >= v18.0.0
- **npm** >= v9.0.0
- A **Supabase** account & an **OpenRouter** API key (for AI features)

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Pusri27/AiLearning.git
cd AiLearning
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Environment Configuration
Create a `.env` file in `apps/dashboard/.env` and add the following keys:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_OPENROUTER_API_KEY=your-openrouter-api-key
```

### 4️⃣ Database Setup (Supabase)
1. Open the **SQL Editor** in your Supabase Dashboard.
2. Execute the entire SQL script from `apps/dashboard/src/lib/FULL_SETUP.sql`.
3. Create two public buckets under **Storage**: `avatars` and `syllabus_files`.
4. (Optional) Run the database seeders:
   ```bash
   cd apps/dashboard
   npm run seed
   npm run seed:blog
   ```

### 5️⃣ Run Locally (Development Server)
From the root directory, start the development server:
```bash
npm run dev
```
Access the application at `http://localhost:5173`.

---

## 🌐 Deployment

For complete end-to-end deployment instructions on **Vercel** (Frontend) and **Supabase** (Backend), refer to the **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** document.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ by <b>Natade / Pusri</b></sub>
</div>
