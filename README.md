# JobTrack — React + Supabase

A simple personal job application tracker built with React, Vite, Supabase, and a shadcn-inspired UI.

## Features

- Supabase authentication with email/password
- Cloud database for job applications
- Row Level Security: users can only access their own applications
- Dashboard with pipeline metrics
- Search and filters
- Add / edit / delete applications
- Job post links
- Interview notes
- Roles & responsibilities
- Responsive layout
- No localStorage dependency

## 1. Install

Open a terminal in this folder:

```bash
npm install
```

## 2. Create a Supabase project

Go to https://supabase.com/ and create a project.

In the Supabase dashboard, open:

**SQL Editor → New query**

Copy everything from:

```text
supabase/schema.sql
```

Paste it into the SQL editor and run it.

This creates the `applications` table and its Row Level Security policies.

## 3. Get your Supabase credentials

In Supabase:

**Project Settings → API**

Copy:

- Project URL
- Publishable/anon key

Create a file named `.env` in the project root:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Do not commit your `.env` file to GitHub.

The browser app should use the public/publishable anon key. The database is protected by Row Level Security.

## 4. Email confirmation

For easiest local testing, you can disable email confirmation in Supabase under:

**Authentication → Providers → Email**

If email confirmation is enabled, sign-up will ask the user to confirm their email before signing in.

## 5. Run

```bash
npm run dev
```

Then open the localhost URL shown by Vite.

## 6. Build

```bash
npm run build
npm run preview
```

## Folder structure

```text
jobtrack-supabase/
├── src/
│   ├── main.jsx
│   └── styles.css
├── supabase/
│   └── schema.sql
├── .env.example
├── index.html
├── package.json
└── README.md
```

## Security note

Never put a Supabase service-role key in a Vite frontend. Only use the public/publishable anon key in `.env`. The included Row Level Security policies ensure each authenticated user can only read and modify rows where `user_id = auth.uid()`.
