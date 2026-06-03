# 📸 KompotTrip — Photo Booth & Agenda

A shared travel photo album and trip agenda for the Kompot road trip crew (May 23–24, 2026).
Upload photos and videos, browse everyone's memories, and follow the trip itinerary — all in one place.

---

## 🗺️ What This App Does

| Feature | Description |
|---|---|
| **Photo Booth** | Upload photos & videos, browse a shared gallery with lightbox |
| **Trip Agenda** | Day-by-day roadmap, stops, meals, costs & payment tracking |
| **Shared Album** | Everyone on the trip can upload and view each other's memories |

---

## 🖼️ How Images Work — The Full Journey

This is the most important part of the app. Here's exactly what happens when someone uploads a photo, and why it's built this way.

### Step 1 — User Selects a File

The user picks a photo or video in the upload form (`PhotoUploadForm` component). The file is held in the browser's memory — nothing is uploaded yet.

### Step 2 — Upload to Google Drive (`POST /api/upload`)

When the user clicks **Submit**, the browser sends the file to our Next.js API route:

```
POST /api/upload
```

**What happens inside this route:**

1. **Authenticates with Google** using OAuth2 credentials stored in environment variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`). The app uses a long-lived refresh token so it never needs to ask the user to log in.

2. **Converts the file to a stream** — Vercel's serverless functions don't have a real filesystem, so the file is converted to an in-memory Node.js `Readable` stream instead of being saved to disk.

3. **Uploads to Google Drive** into the configured folder (`NEXT_PUBLIC_GDRIVE_FOLDER_ID`) using the Google Drive API v3.

4. **Makes the file public** — sets a `reader` permission for `anyone` so the image can be accessed without logging into Google.

5. **Returns a proxy URL** — instead of giving the browser a direct Google Drive link, it returns our own internal URL:
   ```
   /api/image?id=<googleDriveFileId>
   ```

> **Why not return the Google Drive link directly?**
> Google Drive serves images with aggressive CORS headers and sometimes forces a cookie/login redirect in the browser, which breaks `<img>` tags. By returning our own proxy URL instead, we avoid this problem entirely.

### Step 3 — Metadata Saved to Supabase

After a successful upload, the app saves a record to the `trip_photos` table in Supabase with:
- The uploader's name
- A caption / description
- The proxy image URL (`/api/image?id=...`)
- A timestamp

Supabase acts as the **database** — it stores who uploaded what and when, but the actual image file lives in Google Drive.

### Step 4 — Gallery Fetches from Supabase

When the gallery page loads, it queries Supabase:

```js
supabase.from('trip_photos').select('*').order('created_at', { ascending: false })
```

This returns all photo records. The gallery renders each one using the stored proxy URL.

### Step 5 — Image Proxy Serves the File (`GET /api/image`)

When a browser loads an `<img src="/api/image?id=...">` tag, our proxy route runs:

```
GET /api/image?id=<googleDriveFileId>
```

**What happens inside this route:**

1. Fetches the raw image bytes from Google Drive **server-side** (not in the browser), using a standard `fetch` with a browser-like `User-Agent` header to avoid Google's bot detection.

2. Follows any 302 redirects automatically (Google Drive often redirects to the actual file).

3. Returns the raw image bytes directly to the browser with:
   - The correct `Content-Type` header (e.g. `image/jpeg`)
   - A `Cache-Control: public, max-age=31536000` header — the image is cached for **1 year** in the browser, so Google Drive is only hit once per image per user.

> **Why does this work?**
> Google blocks direct `<img src="https://drive.google.com/...">` in browsers due to CORS and redirect policies. But when our **server** fetches it (not the browser), Google has no reason to block it — the server looks just like any normal HTTP client. The server then passes the bytes straight to the browser as if the image came from our own server.

---

## 📐 Architecture Diagram

```
Browser                    Next.js Server              External Services
───────                    ──────────────              ─────────────────

[Upload Form]
     │
     │  POST /api/upload
     │  (file bytes)
     └──────────────────► [/api/upload route]
                                │
                                │  OAuth2 auth
                                │  Stream upload
                                └──────────────────► [Google Drive API]
                                                           │
                                                     stores file,
                                                     returns fileId
                                ◄──────────────────────────┘
                                │
                                │  save metadata
                                │  (name, caption, url, timestamp)
                                └──────────────────► [Supabase DB]
                                
     │  returns /api/image?id=...
     ◄──────────────────────────┘

[Gallery]
     │
     │  fetch photos list
     └──────────────────► [Supabase DB]
                          returns rows with proxy URLs
     ◄──────────────────────────┘
     │
     │  <img src="/api/image?id=...">
     └──────────────────► [/api/image route]
                                │
                                │  server-side fetch
                                └──────────────────► [Google Drive]
                                                     returns raw bytes
                                ◄──────────────────────────┘
                                │  streams bytes back
     ◄──────────────────────────┘
     │
  [Image displays in browser] ✅
```

---

## ⚙️ Environment Variables

Never commit `.env.local` — add these in Vercel's dashboard under **Settings → Environment Variables** for production.

| Variable | What it's for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key (safe to expose) |
| `NEXT_PUBLIC_GDRIVE_FOLDER_ID` | Google Drive folder ID where photos are stored |
| `GOOGLE_CLIENT_ID` | Google OAuth2 Client ID (server-side only) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 Client Secret (server-side only) |
| `GOOGLE_REFRESH_TOKEN` | Long-lived refresh token for Google Drive access |

---

## 🚀 Getting Started (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Create your env file
cp .env.example .env.local
# Fill in your real values in .env.local

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the Photo Booth.  
Open [http://localhost:3000/agenda](http://localhost:3000/agenda) to see the Trip Agenda.

---

## 🗄️ Supabase Table Setup

Create a table called `trip_photos` in your Supabase project with these columns:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, auto-generated |
| `uploader_name` | `text` | Who uploaded the photo |
| `caption` | `text` | Optional description |
| `photo_url` | `text` | The `/api/image?id=...` proxy URL |
| `file_type` | `text` | `image` or `video` |
| `created_at` | `timestamptz` | Auto-set on insert |

Enable **Row Level Security (RLS)** and add a policy to allow public reads and inserts.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org/) (App Router) |
| Database | [Supabase](https://supabase.com/) (PostgreSQL) |
| File Storage | [Google Drive API v3](https://developers.google.com/drive) |
| Auth (Drive) | Google OAuth2 with Refresh Token |
| Styling | Vanilla CSS (`globals.css`) |
| Deployment | [Vercel](https://vercel.com/) |

---

## 📁 Key Files

```
src/
├── app/
│   ├── page.js                  # Photo Booth home page
│   ├── agenda/                  # Trip agenda pages
│   └── api/
│       ├── upload/route.js      # Handles file upload → Google Drive
│       └── image/route.js       # Proxies images from Google Drive
├── components/
│   ├── PhotoUploadForm.js       # Upload UI component
│   └── PhotoGallery.js          # Gallery + lightbox component
└── lib/
    └── supabase.js              # Supabase client setup
```

---

## 🔐 Security Notes

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REFRESH_TOKEN` are **server-side only** — they are never exposed to the browser.
- `NEXT_PUBLIC_*` variables are visible in the browser — only non-sensitive values use this prefix.
- `.env.local` is excluded from git via `.gitignore` and should never be committed.

---

*Kompot Road Trip · May 2026 · Made with ❤️ by the crew*
