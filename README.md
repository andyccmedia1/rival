# Rival ⚔️

A partner challenge app with anime energy. Challenge someone to a commitment period, check off daily goals, and see who stays the course.

## Setup

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run everything in `supabase-schema.sql`
3. Copy your **Project URL** and **anon public** key from Settings → API

### 2. Local dev

```bash
cp .env.example .env
# Fill in your Supabase URL and anon key in .env

npm install
npm run dev
```

### 3. Deploy to Netlify

1. Push this folder to a GitHub repo
2. Connect to Netlify → **New site from Git**
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

That's it! The `netlify.toml` handles SPA routing automatically.

## How it works

1. **Player 1** creates a challenge → picks duration + goals → gets a shareable link
2. **Player 2** opens the link → picks their own goals → challenge starts
3. Both players check off daily goals each day
4. Live scoreboard shows % completion for each player
5. On end date, winner screen reveals who stayed the course

## Tech stack

- React + Vite
- Supabase (Postgres + realtime)
- React Router
- date-fns
- Netlify (hosting)
