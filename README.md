# First Desk

A Todoist-style task manager. React + Vite, Supabase (Postgres), deployed on Vercel.

## Setup
1. Create a Supabase project (free tier). In **SQL Editor**, run `supabase/schema.sql`.
2. Copy `.env.example` to `.env` and fill in values from Supabase > Project Settings > API.
3. `npm install && npm run dev`

## Deploy
Push to GitHub, import the repo in Vercel (Vite is auto-detected), and add the two `VITE_SUPABASE_*` environment variables.

**No login:** anyone with the link shares the same tasks and projects.
