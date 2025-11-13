# Beat Maker

A simple, clean beat maker app with drums, piano, and AI rapper features.

## Features

- **8-beat sequencer** for drums (Kick, Hi-Hat, Cymbal, Snare)
- **Compact piano roll** with 4 keys (C4, E4, G4, A4)
- **AI Rapper** with realistic animated face and tempo-matched lyrics
- **User authentication** with Supabase (login/signup)
- **Save and load beats** - persist your creations

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your Project URL and anon key
4. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Database

1. Go to your Supabase project SQL Editor
2. Run the SQL from `supabase-setup.sql` to create the beats table

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- **Drums**: Click the beat cells to toggle drum sounds on/off
- **Piano**: Click cells to place notes on beats
- **AI Rapper**: Enter lyrics that fit in 8 beats (the app will validate this)
- **Save Beats**: Login to save and load your beats

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Supabase (Authentication & Database)
- Web Audio API
