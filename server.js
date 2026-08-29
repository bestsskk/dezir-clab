const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// 1. Parse local .env file into process.env if present (does not overwrite existing environment variables)
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const k = trimmed.substring(0, eqIdx).trim();
          let v = trimmed.substring(eqIdx + 1).trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.substring(1, v.length - 1);
          }
          if (!process.env[k]) {
            process.env[k] = v;
          }
        }
      }
    });
    console.log('[Dezir Clab] Loaded environment variables from .env');
  }
} catch (e) {
  console.warn('[Dezir Clab] Could not read .env file:', e.message);
}

// 2. Set default Database URL if not specified
if (!process.env.DATABASE_URL) {
  const defaultSqlitePath = path.join(__dirname, 'prisma', 'dev.db');
  process.env.DATABASE_URL = `file:${defaultSqlitePath}`;
}

// 3. Helper to locate compiled frontend dist/index.html
function getDistIndexPath() {
  const candidates = [
    path.join(__dirname, 'dist', 'index.html'),
    path.join(process.cwd(), 'dist', 'index.html'),
    path.resolve('dist/index.html'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

// 4. Self-Healing Auto-Build if frontend is missing on cloud boot
if (!getDistIndexPath()) {
  console.log('[Dezir Clab] Frontend bundle missing. Running automated build...');
  try {
    execSync('npx vite build', { stdio: 'inherit' });
    console.log('[Dezir Clab] Automated frontend build completed!');
  } catch (buildErr) {
    console.warn('[Dezir Clab] Automated build skipped/error:', buildErr.message);
  }
}

const { prisma } = require('./server/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxies (Railway, Netlify, Cloudflare) for secure cookies & HTTPS detection
app.set('trust proxy', 1);

// Security & Parsing Middlewares with full CORS Credentials support
const corsOptions = {
  origin: (origin, callback) => {
    // Allow browser requests from Netlify domains, custom domains, localhost, or direct API calls
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id', 'x-requested-with', 'Accept'],
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());

// Static Uploads & Public Assets
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(process.cwd(), 'dist')));

// Diagnostic Health & Ping Endpoints (Used by Railway, Netlify, and Monitoring)
app.get('/api/ping', async (req, res) => {
  let dbStatus = 'disconnected';
  let totalUsers = 0;
  let totalProfiles = 0;
  let adminEmail = '';

  try {
    totalUsers = await prisma.user.count();
    totalProfiles = await prisma.managedProfile.count();
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    adminEmail = admin?.email || 'none';
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  return res.json({
    status: 'ok',
    message: 'Pong! Dezir Clab Backend API engine is active and healthy.',
    timestamp: new Date().toISOString(),
    platform: process.env.RAILWAY_ENVIRONMENT ? 'Railway Cloud' : (process.env.NETLIFY ? 'Netlify' : 'Self-Hosted'),
    node: process.version,
    port: PORT,
    database: {
      status: dbStatus,
      totalUsers,
      totalProfiles,
      adminEmail,
    },
    env: {
      hasSessionSecret: Boolean(process.env.SESSION_SECRET),
      hasAdminPassword: Boolean(process.env.ADMIN_PASSWORD),
      isProduction: process.env.NODE_ENV === 'production',
    },
  });
});

app.get('/api/health', async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalProfiles = await prisma.managedProfile.count();
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, role: true, status: true },
    });

    return res.json({
      success: true,
      diagnostics: {
        server: 'Dezir Clab Express Production Engine',
        status: 'healthy',
        platform: process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Production',
        timestamp: new Date().toISOString(),
        database: {
          status: 'connected',
          totalUsers,
          totalProfiles,
          adminUser: admin,
        },
      },
    });
  } catch (err) {
    return res.status(200).json({
      success: false,
      diagnostics: {
        server: 'Dezir Clab Express Production Engine',
        status: 'database_initializing',
        error: err.message,
      },
    });
  }
});

// Mount Application API Routers
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/feed', require('./server/routes/feed'));
app.use('/api/profiles', require('./server/routes/profiles'));
app.use('/api/posts', require('./server/routes/posts'));
app.use('/api/conversations', require('./server/routes/conversations'));
app.use('/api/notifications', require('./server/routes/notifications'));
app.use('/api/account', require('./server/routes/account'));
app.use('/api/invitations', require('./server/routes/invitations'));
app.use('/api/admin', require('./server/routes/admin'));

// Single Page Application (SPA) Fallback for Express (Serves React frontend on all non-API routes)
app.use((req, res) => {
  // If requesting an unmatched API route, return 404 JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found.` });
  }

  const indexPath = getDistIndexPath();
  if (indexPath) {
    return res.sendFile(indexPath);
  }

  return res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head><title>Dezir Clab</title></head>
      <body style="background:#0c0d0e;color:#f4f4f5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="text-align:center;padding:2rem;">
          <h1 style="color:#e11d48;margin-bottom:0.5rem;">Dezir Clab</h1>
          <p style="color:#a1a1aa;">Backend engine is running.</p>
          <p style="margin-top:1rem;"><a href="/api/health" style="color:#f59e0b;text-decoration:none;">Check Health Status &rarr;</a></p>
        </div>
      </body>
    </html>
  `);
});

// Start listening
app.listen(PORT, () => {
  console.log(`[Dezir Clab] Production Express server running on port ${PORT}`);
  console.log(`[Dezir Clab] Railway & Netlify ready — Health endpoint at /api/health`);
});
