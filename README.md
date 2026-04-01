# Sofi Tracker

A personal daily tracker for mood, habits, productivity, and journaling. Built with React + Vite.

## Features

- **Daily log** — mood (emoji scale), weather, hours per category with notes, gym type, cycle phase, morning pages + night reflection with daily writing prompts
- **Calendar** — monthly view with mood-colored days, cycle + weather indicators
- **Dashboard** — Mood Story visualization, correlation cards (gym/cycle/weather impact on mood), stacked hours chart
- **Settings** — fully configurable hour categories (add, remove, rename, reorder, change colors)
- **Data** — localStorage persistence, CSV export, demo data for preview

## Quick Start (Local)

```bash
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev

# 3. Open http://localhost:5173
```

## Deploy to Vercel (Free)

### Option A: Via GitHub (recommended)

1. **Create a GitHub repo:**
   ```bash
   # From this folder:
   git init
   git add .
   git commit -m "Initial commit: Sofi Tracker v1"
   
   # Create repo on github.com/new, then:
   git remote add origin https://github.com/YOUR_USERNAME/sofi-tracker.git
   git branch -M main
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com) and sign in with GitHub
   - Click "Add New Project"
   - Import your `sofi-tracker` repo
   - Framework: Vite (auto-detected)
   - Click "Deploy"
   - Done! You get a URL like `sofi-tracker.vercel.app`

3. **Future updates:**
   ```bash
   # Make changes, then:
   git add .
   git commit -m "Description of changes"
   git push
   # Vercel auto-deploys on push
   ```

### Option B: Direct deploy (no GitHub)

```bash
# Install Vercel CLI
npm i -g vercel

# From project folder:
vercel

# Follow prompts. Done.
```

## Customizing

### Hour categories
Use the ⚙️ Config tab to add, remove, or edit categories. Changes are saved automatically and persist across sessions.

### Code changes
The entire app lives in `src/App.jsx`. Key sections are labeled with comments:
- `CONSTANTS` — moods, phases, weather options, gym types
- `LOG FORM` — the daily entry form
- `CALENDAR` — monthly grid view
- `DASHBOARD` — charts and comparisons
- `SETTINGS` — category editor

### Data storage
All data lives in `localStorage` under two keys:
- `tracker-entries` — all daily entries
- `tracker-categories` — custom hour categories

To backup: use the CSV export button. To migrate: copy the localStorage values between browsers.

## Tech Stack

- React 18
- Vite 5
- Recharts (bar charts)
- Custom SVG (Mood Story visualization)
- localStorage (persistence)
- Google Fonts (Fraunces + Work Sans)

## License

Personal project by Sofía de Proença.
