# Dezir Clab: Production-Ready Private Community Platform

An exclusive, mobile-first, invitation-only private community platform built with **React (Vite SPA)**, **Express.js High-Performance Backend**, **Prisma / SQL Database Engine**, and a custom **Glassmorphism Design System**.

Designed for high-converting memberships and private social interaction, the post-login experience centers around a **Facebook-Group Style Community Feed** with 10 admin-managed creator profiles, real-time persona-driven messaging, rich photo/video dispatches, and cryptographic invitation access control.

---

## 🌟 Key Architecture & Highlights

1. **Feed-First Post-Login Experience (`/dashboard`)**:
   - Redirects members directly to the central **Community Feed**.
   - Pinned announcements with action banners.
   - Rich media post stream (photos, videos, captions, relative timestamps).
   - Real-time animated **Reaction Popover** (❤️ Love, 🔥 Fire, 😍 Wow, 👍 Like).
   - Expandable **Threaded Comment Sections** with report moderation.
   - Filter tabs: Latest, Popular, Announcements, Photos, Videos.

2. **10 Admin-Managed Creator Profiles**:
   - 10 Indian female creator slots (Priya Sharma, Ananya Sen, Meera Kapoor, Sunita Rao, Kavita Verma, Pooja Patel, Neha Singhania, Ritu Malhotra, Rekha Joshi, Shalini Nair).
   - Admin controls profile name, bio, avatar, display order, and status.
   - Personas act as post authors and messaging identities without separate logins.

3. **Strict Cryptographic Invitation Access Control**:
   - Direct registrations without a valid invitation token are strictly blocked.
   - Access requires cryptographically verified tokens (`/register?token=VIP-COMMUNITY-2026`).
   - Server-side validation checks token existence, active status, expiration date, and remaining usage limits.

4. **Secret Admin Portal (`/likecrazy`)**:
   - Secret administrative URL (standard `/admin` paths return 404 for total privacy).
   - **Overview Dashboard**: Real-time KPIs (Members, Profiles, Posts, Reactions, Comments, Unread Messages, Active Invitations).
   - **Member Management**: Search, filter by status (`ACTIVE`, `SUSPENDED`, `BANNED`), and **Device Reset / Kick / Ban**.
   - **Post Publisher**: Publish standard posts, photo/video dispatches, and pinned announcements.
   - **Messaging Hub**: View all member inquiries and reply as any creator persona.
   - **Invitation Management**: Generate crypto-random token URLs with custom expirations and usage limits.
   - **Security Audit Logs**: Immutable history of admin actions with timestamps and client IPs.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite 8, React Router 7, Lucide Icons, Vanilla CSS Glassmorphism
- **Backend API**: Express 5, Cookie Parser, CORS with Credentials, bcryptjs
- **Database**: SQLite with `sql.js` (Zero-config, auto-initializing, auto-seeding)
- **Deployment**: **Netlify** (Frontend SPA CDN) & **Railway** (Backend Engine & Database)

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Start Vite frontend dev server
npm run dev

# 3. In another terminal, start the Express backend
npm run start
```

---

## 🌐 Deploying to Netlify & Railway

Detailed step-by-step instructions are available in [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

### 1. Railway (Backend API)
- Connect repository on [Railway](https://railway.app).
- Railway uses `railway.json` and `Procfile` to run `node server.js`.
- Add environment variables:
  ```env
  NODE_ENV=production
  SESSION_SECRET=community-private-super-secret-session-key-32-chars-min
  ADMIN_EMAIL=admin@community.vip
  ADMIN_PASSWORD=AdminSecret2026!
  ```
- Generate a domain under **Networking** (e.g. `https://your-backend.up.railway.app`).

### 2. Netlify (Frontend SPA)
- Connect repository on [Netlify](https://netlify.com).
- Build command: `npm run build` | Publish directory: `dist`.
- In `netlify.toml`, update the `/api/*` rewrite target to your Railway domain.
- Deploy site!

---

## 🔑 Default Credentials & Invitations

| Role / Item | Value |
| :--- | :--- |
| **Secret Admin Portal** | `https://your-domain.com/likecrazy` |
| **Admin Email** | `admin@community.vip` |
| **Admin Password** | `AdminSecret2026!` |
| **VIP Invite Code** | `VIP-COMMUNITY-2026` |
| **Executive Invite Code** | `EXECUTIVE-INVITE-01` |
| **Health Check Endpoint** | `/api/health` |
