
# 🔖 Smart Bookmark App

A modern, real-time bookmark manager built with **Next.js 15** and **Supabase**. This application allows users to save, manage, and search their favorite links with instant synchronization across devices and tabs.

**🔴 Live Demo:** [https://bookmark-app-ten-hazel.vercel.app/](https://bookmark-app-ten-hazel.vercel.app/)

## ✨ Features

* **🔐 Secure Authentication:** Seamless sign-up and login using **Google OAuth** (via Supabase Auth).
* **⚡ Real-Time Synchronization:** Updates (adds/deletes) reflect instantly across all open tabs and devices without refreshing.
* **🔍 Instant Search:** Filter bookmarks by title or URL in real-time.
* **🚀 Optimistic UI:** Interfaces react immediately to user actions for a snappy experience.
* **📱 Responsive Design:** Fully optimized for mobile, tablet, and desktop using Tailwind CSS.
* **🛡️ Row Level Security (RLS):** Data is secured at the database level; users can only access their own bookmarks.

## 🛠️ Tech Stack

* **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Database & Auth:** [Supabase](https://supabase.com/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Icons:** [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

Follow these steps to set up the project locally.

### 1. Prerequisites
* Node.js 18+ installed.
* A [Supabase](https://supabase.com/) account.
* A [Google Cloud Console](https://console.cloud.google.com/) project (for OAuth).

### 2. Clone the Repository
```bash
git clone [https://github.com/your-username/smart-bookmark-app.git](https://github.com/your-username/smart-bookmark-app.git)
cd smart-bookmark-app

```

### 3. Install Dependencies

```bash
npm install

```

### 4. Supabase Setup

1. Create a new project in your Supabase Dashboard.
2. Go to the **SQL Editor** and run the following code to set up the database, security policies, and realtime capabilities:

```sql
-- 1. Create the bookmarks table
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table bookmarks enable row level security;

-- 3. Create Security Policies
create policy "Users can view own bookmarks" on bookmarks
  for select using (auth.uid() = user_id);

create policy "Users can create bookmarks" on bookmarks
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own bookmarks" on bookmarks
  for delete using (auth.uid() = user_id);

-- 4. Enable Realtime
alter publication supabase_realtime add table bookmarks;

-- 5. IMPORTANT: Enable full replica identity for deletes to work correctly in realtime
alter table bookmarks replica identity full;

```

### 5. Google OAuth Setup

1. Go to **Supabase Dashboard** -> **Authentication** -> **Providers** -> **Google** and enable it.
2. Go to **Google Cloud Console** -> **APIs & Services** -> **Credentials**.
3. Create OAuth 2.0 Client Credentials.
* **Authorized Origin:** `http://localhost:3000`
* **Redirect URI:** `http://localhost:3000/auth/callback`


4. Copy the **Client ID** and **Client Secret** into your Supabase Google Provider settings.

### 6. Environment Variables

Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

```

### 7. Run the App

```bash
npm run dev

```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) with your browser to see the result.

## 📦 Deployment

This project is optimized for deployment on **Vercel**.

1. Push your code to a GitHub repository.
2. Import the project into Vercel.
3. Add the Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel dashboard.
4. **Update Supabase Auth:** Add your Vercel production URL (`https://bookmark-app-ten-hazel.vercel.app`) to the **Site URL** and **Redirect URLs** in Supabase Auth settings.
5. **Update Google Cloud:** Add your Vercel URL to the **Authorized Origins** and **Redirect URIs** in the Google Cloud Console.

## 🐛 Troubleshooting

* **Realtime not working?**
Ensure you ran the SQL command `alter publication supabase_realtime add table bookmarks;`.
* **Deletes not syncing?**
Ensure you ran `alter table bookmarks replica identity full;` in the SQL editor.
* **Google Login Error?**
Check that your Redirect URI in Google Cloud Console matches exactly what is in your URL bar (including `http` vs `https`).

```