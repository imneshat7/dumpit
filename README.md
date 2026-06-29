# DumpIt

A civic tech web app for reporting and resolving garbage dumping in small towns, built for a town in Bihar, India.

**Live demo:** [dumpit-gamma.vercel.app](https://dumpit-gamma.vercel.app/)

## Problem

Garbage reporting in small Indian towns is informal — there's no structured way for a citizen to flag a dump site and have it tracked through to cleanup. DumpIt gives citizens a way to report a location with a photo, lets municipal admins triage and assign those reports, and gives field workers a clear task list synced in real time.

## Roles

- **Citizen** — submits a report with a photo, description, and auto-captured GPS location.
- **Admin** — views all reports on a live map, assigns reports to field workers, and tracks status.
- **Field Worker** — sees only the reports assigned to them, with a one-tap link to the location in Google Maps, and marks them cleared.

Role assignment is done manually in the Supabase table editor rather than via self-service signup. This is intentional — letting users pick their own role at signup would allow anyone to make themselves an admin.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime, Row-Level Security)
- **Maps:** Leaflet.js + OpenStreetMap tiles
- **Deployment:** Vercel

## Architecture Notes

- **RLS policies** enforce role-based data access at the database level, not just in the UI — a citizen's Supabase client can't query another citizen's reports even if the frontend code were bypassed.
- **A Postgres trigger auto-creates a profile row** on signup, so every authenticated user has a `role` immediately without extra app logic.
- **Realtime subscriptions** on the `reports` table push live updates to all three dashboards — no polling, no manual refresh needed when a report's status changes.
- **The Leaflet map and marker layer are decoupled** from the map instance itself, so realtime updates redraw markers without resetting the admin's zoom/pan position.

## Database Schema

**`profiles`**
| Column | Type |
|---|---|
| id | uuid (FK to auth.users) |
| full_name | text |
| role | enum: citizen, admin, field_worker |
| created_at | timestamp |

**`reports`**
| Column | Type |
|---|---|
| id | uuid |
| citizen_id | uuid (FK to profiles) |
| photo_url | text, nullable |
| lat / lng | float |
| description | text |
| status | enum: reported, assigned, cleared |
| assigned_to | uuid, nullable (FK to profiles) |
| created_at | timestamp |

## Local Setup

```bash
git clone https://github.com/imneshat7/dumpit.git
cd dumpit
npm install
```

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev
```

You'll need your own Supabase project with the `profiles` and `reports` tables, the matching RLS policies, a public `reports` storage bucket, and the signup trigger set up to match the schema above.

## Known Limitations

- No automated tests yet.
- Role assignment is manual (by design, see above) — there's no admin UI to promote a user yet.
- No retry/offline handling if a citizen submits a report with a weak signal.


## AI Feature (v2 — in progress)

When a citizen uploads a photo, the image is sent to a Node.js/Express backend which calls the Gemini Vision API to:
- Classify the waste type (Plastic Waste, Organic Waste, Construction Debris, etc.)
- Auto-generate a description of what's visible in the photo

The citizen can edit the AI-generated description before submitting. The waste type is stored in Supabase and displayed on the admin dashboard alongside each report.

**Backend repo:** [github.com/imneshat7/dumpit-server](https://github.com/imneshat7/dumpit-server)  
**Status:** Built and tested locally. Backend deployment pending.