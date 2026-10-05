# First Desk

A Todoist-style task manager. React + Vite, Supabase (auth + Postgres), deployed on Vercel.

## Setup
1. Create a Supabase project (free tier). In **SQL Editor**, run `supabase/schema.sql`.
2. (Optional, for quick testing) Supabase > Authentication > Providers > Email: turn off "Confirm email".
3. Copy `.env.example` to `.env` and fill in values from Supabase > Project Settings > API.
4. `npm install && npm run dev`

## Deploy
Push to GitHub, import the repo in Vercel (Vite is auto-detected), and add the two `VITE_SUPABASE_*` environment variables.
