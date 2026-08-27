# The Guild: Production-Ready Private Paid Community Platform

An exclusive, mobile-first, invitation-only private community platform built with **Next.js 15**, **TypeScript**, **Prisma ORM**, and a custom **Glassmorphism Design System**.

Designed for high-converting memberships and private social interaction, the post-login experience centers around a **Facebook-Group Style Community Feed** with 10 admin-managed resident creator profiles, real-time persona-driven messaging, rich photo/video dispatches, and cryptographic invitation access control.

---

## 🌟 Key Architecture & Highlights

1. **Feed-First Post-Login Experience (`/dashboard`)**:
   - Redirects members directly to the central **Community Feed** (NOT a profile grid).
   - Pinned announcements with action banners.
   - Rich media post stream (photos, videos, captions, relative timestamps).
   - Interactive full-screen **Lightbox Media Viewer** with swipe/navigation.
   - Real-time animated **Reaction Popover** (❤️ Love, 🔥 Fire, 😍 Wow, 👍 Like).
   - Expandable **Threaded Comment Sections** with spam protection and report moderation.
   - Filter tabs: Latest, Popular, Announcements, Photos, Videos.

2. **10 Admin-Managed Resident Content Personas**:
   - 10 distinct creator slots (Sophia, Emma, Olivia, Mia, Ava, Isabella, Amelia, Charlotte, Harper, Evelyn).
   - Admin controls profile name, bio, avatar, cover photo, display order, and status (Active/Hidden/Disabled).
   - Personas act as post authors and messaging identities without independent user accounts.
   - Accessible via post author links and the secondary `/profiles` discovery catalog.

3. **Strict Cryptographic Invitation Access Control**:
   - Unrestricted registrations via `/signup` or `/register` are strictly blocked with an invitation gatekeeper.
   - Access requires cryptographically secure 24-character tokens (`/join/[token]`).
   - Server-side validation checks token existence, active status, expiration date, and remaining usage limits.
   - Automatic single-use exhaustion and multi-use campaign tracking.

4. **Direct Persona Messaging Console**:
   - Members can message any of the 10 resident creators directly from post cards, profiles, or the `/messages` inbox.
   - The Admin Management Console allows admins to select *"Reply as Persona [Sophia]"* and send responses.
   - In-app notification alerts members when a creator replies.

5. **Comprehensive Admin Dashboard Suite (`/admin`)**:
   - **Overview Dashboard**: Real-time KPIs (Members, New Today, Profiles, Posts, Reactions, Comments, Unread Messages, Active Invitations).
   - **Member Management**: Search, filter by status (`ACTIVE`, `SUSPENDED`, `BANNED`), and **Kick/Ban action with instant session revocation**.
   - **Managed Profiles Manager**: Edit the 10 creator slots, toggle visibility, and adjust display orders.
   - **Post Publisher**: Publish standard posts, photo/video dispatches, and pinned announcements.
   - **Messaging Hub**: View all member inquiries and reply as any creator persona.
   - **Invitation Management**: Generate crypto-random token URLs with custom expirations and usage limits.
   - **Comment Moderation**: Review flagged and reported comments.
   - **Media Asset Library**: Upload, filter, and manage high-resolution images and videos.
   - **Security Audit Logs**: Immutable history of admin actions with timestamps and client IPs.
   - **Platform Settings**: Manage branding, marketing headlines, and community posting rules.

6. **Mobile-First Responsive Design**:
   - Fluid responsiveness optimized from 375px (iPhone mini) to 1440px (Desktop Ultra).
   - iOS/Android-style fixed **Mobile Bottom Navigation Bar** with live unread badge counters.
   - Touch-friendly reaction popovers and gesture-enabled media lightboxes.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router, Server Components & Route Handlers)
- **Language**: TypeScript
- **Database & ORM**: Prisma ORM with SQLite (Local Development) & PostgreSQL (Production)
- **Authentication**: Secure HTTP-only cookies, database session tracking, Argon2/bcrypt password hashing
- **Styling**: Vanilla CSS Design System with CSS Custom Properties, Glassmorphism, and responsive grid layouts
- **Icons**: Lucide React
- **Date Formatting**: date-fns

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies
```bash
git clone <repo-url> community
cd community
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default local `.env` values:
```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="community-private-super-secret-session-key-32-chars-min"
ADMIN_EMAIL="admin@community.vip"
ADMIN_PASSWORD="AdminPassword2026!"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
STORAGE_PROVIDER="local"
UPLOAD_DIR="./public/uploads"
```

### 3. Initialize Database & Seed
```bash
# Push Prisma schema to SQLite
npx prisma db push

# Seed Admin account, 10 managed profiles, posts, sample invitations, and settings
npm run seed
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Default Credentials & Test Invitations

### Default Admin Account
- **URL**: [http://localhost:3000/admin](http://localhost:3000/admin) or `/login`
- **Email**: `admin@community.vip`
- **Password**: `AdminPassword2026!`

### Seeded Test Invitations
- **VIP Launch Invitation (Multi-Use)**: [http://localhost:3000/join/VIP-COMMUNITY-2026](http://localhost:3000/join/VIP-COMMUNITY-2026)
- **Single-Use Exclusive Invite**: [http://localhost:3000/join/EXCLUSIVE-INVITE-01](http://localhost:3000/join/EXCLUSIVE-INVITE-01)
- **Expired Test Token**: [http://localhost:3000/join/EXPIRED-TOKEN-DEMO](http://localhost:3000/join/EXPIRED-TOKEN-DEMO)

---

## 🧪 20-Point Automated Verification Suite

Run the full end-to-end test suite:
```bash
npm run test:suite
```

### Verification Results:
```text
✅ TEST 1 PASSED: Invalid registration (blocked without token)
✅ TEST 2 PASSED: Invalid invitation token rejected
✅ TEST 3 PASSED: Valid invitation token verified successfully
✅ TEST 4 PASSED: Member registration & session created
✅ TEST 5 PASSED: Member password authentication validated
✅ TEST 6 PASSED: Domain-only signup without invitation blocked
✅ TEST 7 PASSED: Feed posts exist with profile authorship & media
✅ TEST 8 PASSED: Managed profile page discovery by slug (Sophia)
✅ TEST 9 PASSED: Secondary Profiles catalog lists active managed personas (>=10)
✅ TEST 10 PASSED: Reaction recorded and toggle removed cleanly
✅ TEST 11 PASSED: Member post comment recorded in thread
✅ TEST 12 PASSED: Member inquiry to Sophia received in conversation thread
✅ TEST 13 PASSED: Admin replied as Sophia persona with member notification
✅ TEST 14 PASSED: Admin published post appears in feed
✅ TEST 15 PASSED: Pinned community announcement created & marked pinned
✅ TEST 16 PASSED: Admin Ban terminates active sessions & marks status BANNED
✅ TEST 17 PASSED: Expired invitation token rejected by server
✅ TEST 18 PASSED: Single-use invitation cannot be reused (marked EXHAUSTED)
✅ TEST 19 PASSED: Member role strictly denied admin privileges (role !== ADMIN)
✅ TEST 20 PASSED: Mobile viewport support configured (375px–1440px with bottom navigation bar)
```

---

## 🌐 Production Deployment Guide

### Option A: Deploying on Vercel + Supabase/Neon PostgreSQL

1. **Provision PostgreSQL Database**:
   - Create a free project on [Supabase](https://supabase.com) or [Neon](https://neon.tech).
   - Obtain your `DATABASE_URL` (e.g., `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?pgbouncer=true`).

2. **Switch Prisma Provider for PostgreSQL**:
   In `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Deploy to Vercel**:
   - Push repository to GitHub.
   - Connect repository in Vercel.
   - Configure Environment Variables:
     - `DATABASE_URL`: PostgreSQL connection string
     - `SESSION_SECRET`: Random 64-character secret string
     - `ADMIN_EMAIL`: Your production admin email
     - `ADMIN_PASSWORD`: Your strong production admin password
     - `NEXT_PUBLIC_APP_URL`: Your custom domain (e.g. `https://theguild.vip`)
   - Build Command: `npx prisma generate && npx prisma db push && npm run build`

### Option B: Docker Container Deployment

Create a `Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔒 Production Security Checklist

- [x] Passwords securely hashed with `bcrypt` (10 rounds).
- [x] Sessions managed via database-backed, HTTP-only, SameSite=Lax cookies.
- [x] Admin Kick/Ban feature immediately invalidates all active sessions.
- [x] Registration endpoints enforce server-side invitation token validation.
- [x] Admin routes & APIs reject non-admin users with HTTP 403 Forbidden.
- [x] Rate limiting active on Login, Registration, Messaging, and Commenting endpoints.
- [x] Direct signup via `/signup` and `/register` blocked by invitation gatekeeper.
- [x] Password recovery endpoint does not leak email existence.
- [x] Private member and admin pages configured with `robots: noindex, nofollow`.
- [x] File uploads verified for MIME type and file size restrictions.
