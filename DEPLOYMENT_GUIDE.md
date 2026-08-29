# 🚀 Dezir Clab — Complete Deployment Guide (Netlify & Railway)

This repository is pre-configured for seamless deployment to **Netlify** and **Railway**.

---

## 🏗️ Deployment Architecture Options

You can deploy using either of two battle-tested methods:

| Setup | Frontend | Backend & API | Best For |
| :--- | :--- | :--- | :--- |
| **Option 1 (Recommended)** | **Netlify** (Global Edge CDN) | **Railway** (Node.js/Express) | Ultra-fast page loads, automatic HTTPS, global CDN caching, and isolated backend scaling. |
| **Option 2 (One-Click)** | **Railway** (Full-Stack) | **Railway** (Full-Stack) | Single dashboard, single URL, zero cross-domain configuration. |

---

## 🌟 Option 1: Netlify (Frontend) + Railway (Backend)

### Step 1: Deploy Backend to Railway
1. Go to [railway.app](https://railway.app) and sign in.
2. Click **"New Project"** → **"Deploy from GitHub repo"** → select this repository.
3. Railway will automatically detect `railway.json` and `Procfile`.
4. Go to **Settings** → **Networking** → Click **"Generate Domain"** (e.g. `dezir-backend.up.railway.app`).
5. Go to **Variables** and add:
   ```env
   NODE_ENV=production
   SESSION_SECRET=community-private-super-secret-session-key-32-chars-min
   ADMIN_EMAIL=admin@community.vip
   ADMIN_PASSWORD=AdminSecret2026!
   NEXT_PUBLIC_APP_URL=https://your-netlify-app.netlify.app
   ```
6. Railway will build and launch your backend! Verify by opening `https://<YOUR_RAILWAY_URL>/api/health` in your browser.

> [!TIP]
> The backend database auto-initializes on first launch with Alexander Vance (Admin), 10 Indian managed profiles, and VIP invite codes (`VIP-COMMUNITY-2026`).

---

### Step 2: Deploy Frontend to Netlify
1. Go to [netlify.com](https://netlify.com) and log in.
2. Click **"Add new site"** → **"Import an existing project"** → select your GitHub repository.
3. Netlify will automatically detect settings from `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. In `netlify.toml` (or `public/_redirects`), ensure the `/api/*` rewrite points to your Railway domain:
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://<YOUR_RAILWAY_URL>/api/:splat"
     status = 200
     force = true

   [[redirects]]
     from = "/uploads/*"
     to = "https://<YOUR_RAILWAY_URL>/uploads/:splat"
     status = 200
     force = true

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```
5. Click **"Deploy Site"**.
6. Once deployed, open your Netlify URL (e.g. `https://dezir-clab.netlify.app`).

---

## ⚡ Option 2: Railway Full-Stack (One-Click Standalone)

If you prefer to host everything on a single Railway service:

1. Push this repository to GitHub.
2. Create a new Railway project and select the repository.
3. Under **Variables**, add:
   ```env
   NODE_ENV=production
   SESSION_SECRET=community-private-super-secret-session-key-32-chars-min
   ADMIN_EMAIL=admin@community.vip
   ADMIN_PASSWORD=AdminSecret2026!
   ```
4. Click **Settings** → **Networking** → **"Generate Domain"**.
5. Your app is live with both frontend and backend served on a single URL!

---

## 🔑 Access Credentials & Secret URLs

| Role / Feature | Path / Identifier | Details |
| :--- | :--- | :--- |
| **Secret Admin Portal** | `/likecrazy` | Total secrecy (all standard `/admin` URLs return 404). |
| **Admin Email** | `admin@community.vip` | Pre-seeded superadmin account. |
| **Admin Password** | `AdminSecret2026!` | Configurable via `ADMIN_PASSWORD` env var. |
| **Default VIP Pass** | `VIP-COMMUNITY-2026` | 100 uses pre-activated. |
| **Executive Pass** | `EXECUTIVE-INVITE-01` | Single-use pre-activated pass. |
| **Direct Registration Link** | `/register?token=VIP-COMMUNITY-2026` | Direct link to onboarding flow. |
| **System Diagnostics** | `/api/health` & `/api/ping` | Real-time health status, DB connectivity & stats. |

---

## 📋 Environment Variables Reference Table

| Variable | Required | Platform | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | Railway | Set to `production`. |
| `PORT` | Auto | Railway | Injected automatically by Railway (defaults to 3000). |
| `SESSION_SECRET` | Yes | Railway | 32+ character random string for cryptographic sessions. |
| `ADMIN_EMAIL` | Optional | Railway | Superadmin email (defaults to `admin@community.vip`). |
| `ADMIN_PASSWORD` | Optional | Railway | Superadmin password (defaults to `AdminSecret2026!`). |
| `NEXT_PUBLIC_APP_URL` | Yes | Railway / Netlify | Live URL of your frontend (for invites and CORS). |
| `DATABASE_URL` | Optional | Railway | SQLite by default (`file:./prisma/dev.db`). |
| `RAILWAY_VOLUME_MOUNT_PATH` | Optional | Railway | If using a persistent Railway volume (e.g. `/data`). |

---

## 🛠️ Verification & Troubleshooting

1. **Check Backend Health**:
   Visit `https://<YOUR_RAILWAY_URL>/api/health`. You should receive:
   ```json
   {
     "success": true,
     "diagnostics": {
       "server": "Dezir Clab Express Production Engine",
       "status": "healthy",
       "database": {
         "status": "connected",
         "totalUsers": 1,
         "totalProfiles": 10
       }
     }
   }
   ```

2. **Test Admin Login**:
   Navigate to `https://<YOUR_FRONTEND_URL>/likecrazy` and log in with:
   - **Email**: `admin@community.vip`
   - **Password**: `AdminSecret2026!`

3. **Test Member Registration**:
   Navigate to `https://<YOUR_FRONTEND_URL>/register?token=VIP-COMMUNITY-2026`. Complete the registration with any test name and email to test the device binding.
