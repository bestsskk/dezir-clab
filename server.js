// cPanel Node.js Startup File for Dezir Clab
const fs = require('fs');
const path = require('path');

// 1. Manually parse .env file into process.env if present
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
          if (k && !process.env[k]) {
            process.env[k] = v;
          }
        }
      }
    });
  }
} catch (e) {
  console.warn('Could not read .env file:', e.message);
}

// 2. Automatically sync static assets into standalone directory for Next.js
try {
  const standaloneDir = path.join(__dirname, '.next', 'standalone');
  const staticSrc = path.join(__dirname, '.next', 'static');
  const staticDest = path.join(standaloneDir, '.next', 'static');
  const publicSrc = path.join(__dirname, 'public');
  const publicDest = path.join(standaloneDir, 'public');

  if (fs.existsSync(staticSrc) && !fs.existsSync(staticDest)) {
    fs.mkdirSync(path.join(standaloneDir, '.next'), { recursive: true });
    fs.cpSync(staticSrc, staticDest, { recursive: true });
  }
  if (fs.existsSync(publicSrc) && !fs.existsSync(publicDest)) {
    fs.cpSync(publicSrc, publicDest, { recursive: true });
  }

  // 3. Automatically sync Prisma client & query engine binaries to standalone
  const prismaClientSrc = path.join(__dirname, 'node_modules', '.prisma', 'client');
  const prismaClientDest = path.join(standaloneDir, 'node_modules', '.prisma', 'client');
  if (fs.existsSync(prismaClientSrc) && fs.existsSync(standaloneDir)) {
    fs.mkdirSync(path.join(standaloneDir, 'node_modules', '.prisma'), { recursive: true });
    fs.cpSync(prismaClientSrc, prismaClientDest, { recursive: true });
  }
} catch (err) {
  console.warn('Static asset / engine sync note:', err.message);
}

// 3. Load the standalone production server
const standaloneServer = path.join(__dirname, '.next', 'standalone', 'server.js');
if (fs.existsSync(standaloneServer)) {
  require(standaloneServer);
} else {
  const { createServer } = require('http');
  const { parse } = require('url');
  const next = require('next');

  const port = parseInt(process.env.PORT, 10) || 3000;
  const app = next({ dev: false, dir: __dirname });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    createServer((req, res) => {
      handle(req, res, parse(req.url, true));
    }).listen(port);
  });
}
