# 🚀 Dezir Clab — Live Deployment Guide (Ninzahost & Supabase)

Your **Supabase Cloud Database** is **100% connected, initialized, and seeded**!

---

## 🗄️ 1. Your Live Supabase Database Connection Details

- **Database Type**: PostgreSQL (Serverless Cloud Pooler)
- **Supabase Project**: `earwmmbjsobncvawoqao` (Region: Southeast Asia)
- **Database Status**: ✅ **Active, Initialized, 10 Managed Resident Profiles Seeded**

### Connection Strings for Your Server / Hosting:
```env
DATABASE_URL="postgresql://postgres.earwmmbjsobncvawoqao:3701318%40Luv%40Kanojiya@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.earwmmbjsobncvawoqao:3701318%40Luv%40Kanojiya@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

---

## 🌐 2. How to Deploy to Ninzahost (Step-by-Step)

### Step 1: Open "Setup Node.js App" in Ninzahost cPanel
1. Log into your **Ninzahost cPanel**.
2. Scroll to the **Software** section and click **Setup Node.js App**.
3. Click the blue **"Create Application"** button:
   - **Node.js version**: Select **`20.x`** *(or `18.x`)*
   - **Application mode**: **`Production`**
   - **Application root**: `dezir-clab`
   - **Application URL**: Select your domain (`yourdomain.com`)
   - **Application startup file**: `server.js`
4. Click **Create**.

---

### Step 2: Upload Your Project Files
1. In your local terminal, build the production bundle:
   ```bash
   npm run build
   ```
2. Upload the project folder to `/home/yourusername/dezir-clab/` in cPanel File Manager (via ZIP or FTP).
3. Ensure these files/folders are in `/dezir-clab/`:
   - `.next/`
   - `public/`
   - `prisma/`
   - `server.js`
   - `package.json`
   - `.env`

---

### Step 3: Add Environment Variables in Ninzahost cPanel
In **Setup Node.js App** → scroll down to **Environment variables** → Click **Add Variable**:

| Variable Name | Value |
| :--- | :--- |
| **`DATABASE_URL`** | `postgresql://postgres.earwmmbjsobncvawoqao:3701318%40Luv%40Kanojiya@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| **`DIRECT_URL`** | `postgresql://postgres.earwmmbjsobncvawoqao:3701318%40Luv%40Kanojiya@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres` |
| **`NEXT_PUBLIC_APP_URL`** | `https://yourdomain.com` *(replace with your real domain)* |
| **`SESSION_SECRET`** | `community-private-super-secret-session-key-32-chars-min` |

---

### Step 4: Click "Run NPM Install" & "Restart Application"
1. In the cPanel **Setup Node.js App** screen, click **"Run NPM Install"**.
2. Click the orange/green **"Restart"** button at the top.
3. Open **`https://yourdomain.com`** in your browser — your website is now live!

---

## 🔑 3. Your Secret Admin Access & Credentials

- **Admin URL**: `https://yourdomain.com/likecrazy`
- **Email**: `admin@community.vip`
- **Password**: `AdminSecret2026!`

*(Note: All old `/admin` links return HTTP 404 for total secrecy).*
