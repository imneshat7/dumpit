# DumpIt 🗑️

A civic tech web app that allows citizens to report garbage dump locations in their town. Built to solve a real problem in small-town Bihar, India.

## Features

- 📍 Report garbage locations with GPS coordinates
- 📸 Photo upload for visual evidence
- 👥 Role-based access: Citizen, Admin, Field Worker
- 🔐 Secure authentication with Supabase Auth
- 🗄️ Row Level Security (RLS) for data protection

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (Auth + PostgreSQL + Storage + RLS)
- Vercel (deployment)

## Project Status

🚧 In active development. Current build includes citizen auth and report submission. Admin dashboard and field worker views coming next.

## Local Setup

1. Clone the repo
2. Run `npm install`
3. Create `.env` file with your Supabase credentials:
