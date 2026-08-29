const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

function generateCuid() {
  return 'c' + Date.now().toString(36) + crypto.randomBytes(6).toString('hex');
}

function getInitialAvatar(name) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=1e293b&textColor=f8fafc`;
}

let dbInstance = null;
let dbFilePath = null;

function getDbPath() {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }
  if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
    const volPath = process.env.RAILWAY_VOLUME_MOUNT_PATH;
    if (!fs.existsSync(volPath)) {
      try { fs.mkdirSync(volPath, { recursive: true }); } catch (e) {}
    }
    return path.join(volPath, 'dev.db');
  }
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:')) {
    const rawPath = process.env.DATABASE_URL.replace(/^file:/, '');
    return path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
  }
  const candidates = [
    path.join(__dirname, '..', 'prisma', 'dev.db'),
    path.join(__dirname, '..', 'dev.db'),
    path.join(process.cwd(), 'prisma', 'dev.db'),
    path.join(process.cwd(), 'dev.db'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  const defaultDir = path.join(__dirname, '..', 'prisma');
  if (!fs.existsSync(defaultDir)) {
    try { fs.mkdirSync(defaultDir, { recursive: true }); } catch (e) {}
  }
  return path.join(defaultDir, 'dev.db');
}

function initSchemaAndSeed(db) {
  try {
    // 1. Create tables if not exist
    db.run(`
      CREATE TABLE IF NOT EXISTS User (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'MEMBER',
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        avatarUrl TEXT,
        bio TEXT,
        invitationId TEXT,
        deviceId TEXT,
        deviceInfo TEXT,
        deviceBoundAt TEXT,
        lastLoginAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS ManagedProfile (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        avatarUrl TEXT NOT NULL,
        coverUrl TEXT,
        bio TEXT NOT NULL,
        age INTEGER,
        location TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        isFeatured INTEGER NOT NULL DEFAULT 1,
        displayOrder INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS Post (
        id TEXT PRIMARY KEY,
        profileId TEXT,
        authorUserId TEXT,
        postType TEXT NOT NULL DEFAULT 'STANDARD',
        caption TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PUBLISHED',
        isPinned INTEGER NOT NULL DEFAULT 0,
        pinnedOrder INTEGER NOT NULL DEFAULT 0,
        announcementTitle TEXT,
        announcementCtaText TEXT,
        announcementCtaLink TEXT,
        scheduledAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS PostMedia (
        id TEXT PRIMARY KEY,
        postId TEXT NOT NULL,
        mediaUrl TEXT NOT NULL,
        thumbnailUrl TEXT,
        mediaType TEXT NOT NULL DEFAULT 'IMAGE',
        caption TEXT,
        displayOrder INTEGER NOT NULL DEFAULT 0,
        width INTEGER,
        height INTEGER,
        size INTEGER,
        mimeType TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS Reaction (
        id TEXT PRIMARY KEY,
        postId TEXT NOT NULL,
        userId TEXT NOT NULL,
        reactionType TEXT NOT NULL DEFAULT 'LIKE',
        createdAt TEXT NOT NULL,
        UNIQUE(postId, userId)
      );

      CREATE TABLE IF NOT EXISTS Comment (
        id TEXT PRIMARY KEY,
        postId TEXT NOT NULL,
        userId TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PUBLISHED',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS CommentReport (
        id TEXT PRIMARY KEY,
        commentId TEXT NOT NULL,
        reportedByUserId TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS Conversation (
        id TEXT PRIMARY KEY,
        memberId TEXT NOT NULL,
        profileId TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        lastMessageAt TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        UNIQUE(memberId, profileId)
      );

      CREATE TABLE IF NOT EXISTS Message (
        id TEXT PRIMARY KEY,
        conversationId TEXT NOT NULL,
        senderType TEXT NOT NULL,
        senderUserId TEXT,
        content TEXT NOT NULL,
        readAt TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS Invitation (
        id TEXT PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        maxUses INTEGER NOT NULL DEFAULT 1,
        currentUses INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        expiresAt TEXT,
        notes TEXT,
        createdByUserId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS Session (
        id TEXT PRIMARY KEY,
        sessionToken TEXT UNIQUE NOT NULL,
        userId TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        ipAddress TEXT,
        userAgent TEXT,
        deviceId TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS PasswordReset (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expiresAt TEXT NOT NULL,
        usedAt TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS Notification (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        linkUrl TEXT,
        readAt TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS AdminAuditLog (
        id TEXT PRIMARY KEY,
        adminUserId TEXT,
        action TEXT NOT NULL,
        targetType TEXT,
        targetId TEXT,
        detailsJson TEXT,
        ipAddress TEXT,
        userAgent TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS SiteSetting (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        createdAt TEXT,
        updatedAt TEXT NOT NULL
      );
    `);

    // 2. Check if admin user exists
    const checkUserStmt = db.prepare('SELECT COUNT(*) as count FROM User WHERE role = "ADMIN"');
    let adminCount = 0;
    if (checkUserStmt.step()) {
      adminCount = checkUserStmt.getAsObject().count || 0;
    }
    checkUserStmt.free();

    if (adminCount === 0) {
      console.log('[Dezir Clab DB] Initializing fresh database with seed data...');
      const now = new Date().toISOString();
      const adminId = generateCuid();
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@community.vip').toLowerCase().trim();
      const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecret2026!';
      const passwordHash = bcrypt.hashSync(adminPassword, 10);

      // Insert Admin
      const userStmt = db.prepare(`
        INSERT INTO User (id, email, passwordHash, firstName, lastName, role, status, avatarUrl, bio, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      userStmt.run([
        adminId,
        adminEmail,
        passwordHash,
        'Alexander',
        'Vance',
        'ADMIN',
        'ACTIVE',
        getInitialAvatar('Alexander Vance'),
        'Founder & Community Director of Dezir Clab.',
        now,
        now,
      ]);
      userStmt.free();

      // Insert 10 Managed Profiles
      const profiles = [
        { name: 'Priya Sharma', slug: 'priya', age: 32, location: 'Mumbai, India', bio: 'Independent creative director & lifestyle curator from South Mumbai. I like meeting energetic younger guys, feel free to message me anytime!' },
        { name: 'Ananya Sen', slug: 'ananya', age: 29, location: 'Kolkata, India', bio: 'Fashion stylist & interior consultant. Love good conversations, travel & relaxed evenings. I really like younger guys, feel free to message me!' },
        { name: 'Meera Kapoor', slug: 'meera', age: 36, location: 'New Delhi, India', bio: 'Entrepreneur & art collector based in Delhi. Passionate about fitness, luxury escapes and vibrant chats. I like charming younger guys, feel free to message me!' },
        { name: 'Sunita Rao', slug: 'sunita', age: 42, location: 'Bengaluru, India', bio: 'Senior architect & design lead in Bengaluru. Love weekend getaways, good wine and fun company. I like younger guys, feel free to message me!' },
        { name: 'Kavita Verma', slug: 'kavita', age: 38, location: 'Pune, India', bio: 'Wellness consultant & yoga enthusiast living life with positive vibes. I enjoy connecting with ambitious younger guys, feel free to message me!' },
        { name: 'Pooja Patel', slug: 'pooja', age: 31, location: 'Ahmedabad, India', bio: 'Digital media executive & event curator. Always up for exciting discussions and weekend road trips. I like fun younger guys, feel free to message me!' },
        { name: 'Neha Singhania', slug: 'neha', age: 34, location: 'Jaipur, India', bio: 'Jewelry designer & boutique owner. Enjoy late night chats, music and creative minds. I like smart younger guys, feel free to message me!' },
        { name: 'Ritu Malhotra', slug: 'ritu', age: 40, location: 'Chandigarh, India', bio: 'Independent business owner & culinary lover. Looking to connect with lively members. I like handsome younger guys, feel free to message me!' },
        { name: 'Rekha Joshi', slug: 'rekha', age: 44, location: 'Hyderabad, India', bio: 'Consultant & classical music lover. Love deep conversations and sweet vibes. I really like younger guys, feel free to message me!' },
        { name: 'Shalini Nair', slug: 'shalini', age: 30, location: 'Kochi, India', bio: 'Brand strategist & coffee connoisseur. Casual, warm and outgoing. I like outgoing younger guys, feel free to message me!' },
      ];

      const profStmt = db.prepare(`
        INSERT OR REPLACE INTO ManagedProfile (id, name, slug, avatarUrl, coverUrl, bio, age, location, status, isFeatured, displayOrder, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1, ?, ?, ?)
      `);
      profiles.forEach((p, idx) => {
        profStmt.run([
          generateCuid(),
          p.name,
          p.slug,
          getInitialAvatar(p.name),
          null,
          p.bio,
          p.age,
          p.location,
          idx + 1,
          now,
          now,
        ]);
      });
      profStmt.free();

      // Insert Default VIP Invitations
      const invStmt = db.prepare(`
        INSERT OR REPLACE INTO Invitation (id, token, maxUses, currentUses, status, expiresAt, notes, createdByUserId, createdAt, updatedAt)
        VALUES (?, ?, ?, 0, 'ACTIVE', ?, ?, ?, ?, ?)
      `);
      const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      invStmt.run([
        generateCuid(),
        'VIP-COMMUNITY-2026',
        100,
        oneYearFromNow,
        'VIP Private Access Pass',
        adminId,
        now,
        now,
      ]);
      invStmt.run([
        generateCuid(),
        'EXECUTIVE-INVITE-01',
        1,
        oneYearFromNow,
        'Executive Single-Use Pass',
        adminId,
        now,
        now,
      ]);
      invStmt.free();

      // Insert Default Site Settings
      const settingStmt = db.prepare(`
        INSERT OR REPLACE INTO SiteSetting (id, key, value, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?)
      `);
      const defaultSettings = [
        { key: 'site_name', value: 'Dezir Clab' },
        { key: 'site_tagline', value: 'Private Fun & Chat Club' },
        { key: 'registration_mode', value: 'INVITATION_ONLY' },
        { key: 'require_invitation', value: 'true' },
        { key: 'allow_public_directory', value: 'false' },
        { key: 'posts_per_page', value: '20' },
        { key: 'media_upload_max_mb', value: '25' },
        { key: 'enable_direct_messages', value: 'true' },
        { key: 'enable_post_comments', value: 'false' },
        { key: 'maintenance_mode', value: 'false' },
      ];
      defaultSettings.forEach((s) => {
        settingStmt.run([generateCuid(), s.key, s.value, now, now]);
      });
      settingStmt.free();

      console.log('[Dezir Clab DB] Fresh database initialized with Admin, 10 Profiles & VIP Invitations.');
    }
  } catch (err) {
    console.error('[Dezir Clab DB] Schema init warning:', err.message);
  }
}

async function getDb() {
  if (dbInstance) return dbInstance;

  dbFilePath = getDbPath();
  const SQL = await initSqlJs();

  if (fs.existsSync(dbFilePath)) {
    const fileBuffer = fs.readFileSync(dbFilePath);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  // Ensure tables and seed data are ready
  initSchemaAndSeed(dbInstance);
  saveDb();

  return dbInstance;
}

function saveDb() {
  if (!dbInstance || !dbFilePath) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbFilePath, buffer);
  } catch (err) {
    console.error('[DB] Failed to persist database to disk:', err.message);
  }
}

function runQuery(sql, params = []) {
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function runExec(sql, params = []) {
  const stmt = dbInstance.prepare(sql);
  stmt.run(params);
  stmt.free();
  saveDb();
}

// Emulate Prisma-like API
const prisma = {
  async init() {
    await getDb();
  },

  user: {
    async count(opts = {}) {
      await getDb();
      let sql = 'SELECT COUNT(*) as count FROM User WHERE 1=1';
      const params = [];
      if (opts.where?.role) {
        sql += ' AND role = ?';
        params.push(opts.where.role);
      }
      if (opts.where?.status) {
        sql += ' AND status = ?';
        params.push(opts.where.status);
      }
      const res = runQuery(sql, params);
      return res[0]?.count || 0;
    },

    async findUnique(opts) {
      await getDb();
      let sql = 'SELECT * FROM User WHERE ';
      const params = [];
      if (opts.where.email) {
        sql += 'email = ?';
        params.push(opts.where.email.toLowerCase().trim());
      } else if (opts.where.id) {
        sql += 'id = ?';
        params.push(opts.where.id);
      }
      const res = runQuery(sql, params);
      return res[0] || null;
    },

    async findFirst(opts = {}) {
      await getDb();
      let sql = 'SELECT * FROM User WHERE 1=1';
      const params = [];
      if (opts.where?.email) {
        sql += ' AND email = ?';
        params.push(opts.where.email.toLowerCase().trim());
      }
      if (opts.where?.role) {
        sql += ' AND role = ?';
        params.push(opts.where.role);
      }
      const res = runQuery(sql, params);
      return res[0] || null;
    },

    async findMany(opts = {}) {
      await getDb();
      let sql = 'SELECT * FROM User WHERE 1=1';
      const params = [];
      if (opts.where?.role) {
        sql += ' AND role = ?';
        params.push(opts.where.role);
      }
      sql += ' ORDER BY createdAt DESC';
      return runQuery(sql, params);
    },

    async create(opts) {
      await getDb();
      const id = opts.data.id || generateCuid();
      const d = opts.data;
      const now = new Date().toISOString();
      const sql = `
        INSERT INTO User (id, email, passwordHash, firstName, lastName, role, status, avatarUrl, bio, deviceId, deviceInfo, deviceBoundAt, invitationId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        id,
        d.email,
        d.passwordHash,
        d.firstName,
        d.lastName,
        d.role || 'MEMBER',
        d.status || 'ACTIVE',
        d.avatarUrl || null,
        d.bio || null,
        d.deviceId || null,
        d.deviceInfo || null,
        d.deviceBoundAt ? new Date(d.deviceBoundAt).toISOString() : null,
        d.invitationId || null,
        now,
        now,
      ];
      runExec(sql, params);
      return { id, ...d, createdAt: now, updatedAt: now };
    },

    async update(opts) {
      await getDb();
      const d = opts.data;
      const sets = [];
      const params = [];

      for (const [k, v] of Object.entries(d)) {
        sets.push(`${k} = ?`);
        params.push(v instanceof Date ? v.toISOString() : v);
      }
      sets.push('updatedAt = ?');
      params.push(new Date().toISOString());

      params.push(opts.where.id || opts.where.email);
      const whereCol = opts.where.id ? 'id' : 'email';
      const sql = `UPDATE User SET ${sets.join(', ')} WHERE ${whereCol} = ?`;
      runExec(sql, params);
      return prisma.user.findUnique({ where: opts.where });
    },
  },

  managedProfile: {
    async count() {
      await getDb();
      const res = runQuery('SELECT COUNT(*) as count FROM ManagedProfile');
      return res[0]?.count || 0;
    },

    async findMany(opts = {}) {
      await getDb();
      let sql = 'SELECT * FROM ManagedProfile WHERE 1=1';
      const params = [];
      if (opts.where?.status) {
        sql += ' AND status = ?';
        params.push(opts.where.status);
      }
      if (opts.where?.isFeatured) {
        sql += ' AND isFeatured = 1';
      }
      sql += ' ORDER BY displayOrder ASC, createdAt DESC';
      if (opts.take) {
        sql += ` LIMIT ${parseInt(opts.take, 10)}`;
      }
      const profiles = runQuery(sql, params);
      return profiles.map((p) => ({
        ...p,
        isFeatured: Boolean(p.isFeatured),
        _count: { posts: 0 },
      }));
    },

    async findUnique(opts) {
      await getDb();
      let sql = 'SELECT * FROM ManagedProfile WHERE ';
      const params = [];
      if (opts.where.slug) {
        sql += 'slug = ?';
        params.push(opts.where.slug);
      } else if (opts.where.id) {
        sql += 'id = ?';
        params.push(opts.where.id);
      }
      const res = runQuery(sql, params);
      if (!res[0]) return null;
      const profile = res[0];
      const posts = await prisma.post.findMany({ where: { profileId: profile.id } });
      return {
        ...profile,
        isFeatured: Boolean(profile.isFeatured),
        posts,
      };
    },

    async create(opts) {
      await getDb();
      const id = opts.data.id || generateCuid();
      const d = opts.data;
      const now = new Date().toISOString();
      const sql = `
        INSERT INTO ManagedProfile (id, name, slug, avatarUrl, coverUrl, bio, age, location, status, isFeatured, displayOrder, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        id,
        d.name,
        d.slug,
        d.avatarUrl,
        d.coverUrl || null,
        d.bio,
        d.age || null,
        d.location || null,
        d.status || 'ACTIVE',
        d.isFeatured ? 1 : 0,
        d.displayOrder || 0,
        now,
        now,
      ];
      runExec(sql, params);
      return { id, ...d, createdAt: now, updatedAt: now };
    },

    async update(opts) {
      await getDb();
      const d = opts.data;
      const sets = [];
      const params = [];
      for (const [k, v] of Object.entries(d)) {
        if (v !== undefined) {
          sets.push(`${k} = ?`);
          params.push(typeof v === 'boolean' ? (v ? 1 : 0) : v);
        }
      }
      sets.push('updatedAt = ?');
      params.push(new Date().toISOString());
      params.push(opts.where.id);
      runExec(`UPDATE ManagedProfile SET ${sets.join(', ')} WHERE id = ?`, params);
      return prisma.managedProfile.findUnique({ where: opts.where });
    },
  },

  post: {
    async count(opts = {}) {
      await getDb();
      let sql = 'SELECT COUNT(*) as count FROM Post WHERE 1=1';
      const params = [];
      if (opts.where?.profileId) {
        sql += ' AND profileId = ?';
        params.push(opts.where.profileId);
      }
      const res = runQuery(sql, params);
      return res[0]?.count || 0;
    },

    async findMany(opts = {}) {
      await getDb();
      let sql = 'SELECT * FROM Post WHERE 1=1';
      const params = [];
      if (opts.where?.profileId) {
        sql += ' AND profileId = ?';
        params.push(opts.where.profileId);
      }
      if (opts.where?.isPinned !== undefined) {
        sql += ' AND isPinned = ?';
        params.push(opts.where.isPinned ? 1 : 0);
      }
      sql += ' ORDER BY isPinned DESC, pinnedOrder ASC, createdAt DESC';
      if (opts.take) {
        sql += ` LIMIT ${parseInt(opts.take, 10)}`;
      }
      const rawPosts = runQuery(sql, params);

      return Promise.all(
        rawPosts.map(async (p) => {
          let profile = null;
          if (p.profileId) {
            const profs = runQuery('SELECT id, name, slug, avatarUrl FROM ManagedProfile WHERE id = ?', [p.profileId]);
            profile = profs[0] || null;
          }
          const media = runQuery('SELECT * FROM PostMedia WHERE postId = ? ORDER BY displayOrder ASC', [p.id]);
          const reactions = runQuery('SELECT userId, reactionType FROM Reaction WHERE postId = ?', [p.id]);
          const commentCountRes = runQuery('SELECT COUNT(*) as c FROM Comment WHERE postId = ? AND status = "PUBLISHED"', [p.id]);

          return {
            ...p,
            isPinned: Boolean(p.isPinned),
            profile,
            media,
            reactions,
            _count: {
              reactions: reactions.length,
              comments: commentCountRes[0]?.c || 0,
            },
          };
        })
      );
    },

    async create(opts) {
      await getDb();
      const id = opts.data.id || generateCuid();
      const d = opts.data;
      const now = new Date().toISOString();
      const sql = `
        INSERT INTO Post (id, profileId, authorUserId, postType, caption, isPinned, pinnedOrder, announcementTitle, announcementCtaText, announcementCtaLink, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        id,
        d.profileId || null,
        d.authorUserId || null,
        d.postType || 'STANDARD',
        d.caption || '',
        d.isPinned ? 1 : 0,
        d.pinnedOrder || 0,
        d.announcementTitle || null,
        d.announcementCtaText || null,
        d.announcementCtaLink || null,
        d.status || 'PUBLISHED',
        now,
        now,
      ];
      runExec(sql, params);

      if (d.media?.create) {
        for (const m of d.media.create) {
          const mId = generateCuid();
          runExec(
            'INSERT INTO PostMedia (id, postId, mediaUrl, mediaType, displayOrder, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
            [mId, id, m.mediaUrl, m.mediaType || 'IMAGE', m.displayOrder || 0, now]
          );
        }
      }

      return { id, ...d, createdAt: now };
    },

    async update(opts) {
      await getDb();
      const d = opts.data;
      const sets = [];
      const params = [];
      for (const [k, v] of Object.entries(d)) {
        sets.push(`${k} = ?`);
        params.push(typeof v === 'boolean' ? (v ? 1 : 0) : v);
      }
      sets.push('updatedAt = ?');
      params.push(new Date().toISOString());
      params.push(opts.where.id);
      runExec(`UPDATE Post SET ${sets.join(', ')} WHERE id = ?`, params);
      const res = await prisma.post.findMany({ where: { id: opts.where.id } });
      return res[0] || null;
    },

    async delete(opts) {
      await getDb();
      runExec('DELETE FROM PostMedia WHERE postId = ?', [opts.where.id]);
      runExec('DELETE FROM Reaction WHERE postId = ?', [opts.where.id]);
      runExec('DELETE FROM Comment WHERE postId = ?', [opts.where.id]);
      runExec('DELETE FROM Post WHERE id = ?', [opts.where.id]);
      return { success: true };
    },
  },

  reaction: {
    async findUnique(opts) {
      await getDb();
      const { postId, userId } = opts.where.postId_userId;
      const res = runQuery('SELECT * FROM Reaction WHERE postId = ? AND userId = ?', [postId, userId]);
      return res[0] || null;
    },

    async create(opts) {
      await getDb();
      const id = generateCuid();
      const d = opts.data;
      const now = new Date().toISOString();
      runExec('INSERT INTO Reaction (id, postId, userId, reactionType, createdAt) VALUES (?, ?, ?, ?, ?)', [
        id,
        d.postId,
        d.userId,
        d.reactionType || 'LIKE',
        now,
      ]);
      return { id, ...d, createdAt: now };
    },

    async update(opts) {
      await getDb();
      runExec('UPDATE Reaction SET reactionType = ? WHERE id = ?', [opts.data.reactionType, opts.where.id]);
      const res = runQuery('SELECT * FROM Reaction WHERE id = ?', [opts.where.id]);
      return res[0] || null;
    },

    async delete(opts) {
      await getDb();
      runExec('DELETE FROM Reaction WHERE id = ?', [opts.where.id]);
      return { success: true };
    },
  },

  comment: {
    async findMany(opts = {}) {
      await getDb();
      let sql = 'SELECT * FROM Comment WHERE 1=1';
      const params = [];
      if (opts.where?.postId) {
        sql += ' AND postId = ?';
        params.push(opts.where.postId);
      }
      if (opts.where?.status) {
        sql += ' AND status = ?';
        params.push(opts.where.status);
      }
      sql += ' ORDER BY createdAt ASC';
      const comments = runQuery(sql, params);
      return comments.map((c) => {
        const users = runQuery('SELECT id, firstName, lastName, avatarUrl, role FROM User WHERE id = ?', [c.userId]);
        return {
          ...c,
          user: users[0] || null,
        };
      });
    },

    async create(opts) {
      await getDb();
      const id = generateCuid();
      const d = opts.data;
      const now = new Date().toISOString();
      runExec('INSERT INTO Comment (id, postId, userId, content, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)', [
        id,
        d.postId,
        d.userId,
        d.content,
        d.status || 'PUBLISHED',
        now,
        now,
      ]);
      const users = runQuery('SELECT id, firstName, lastName, avatarUrl, role FROM User WHERE id = ?', [d.userId]);
      return { id, ...d, user: users[0] || null, createdAt: now };
    },
  },

  conversation: {
    async count() {
      await getDb();
      const res = runQuery('SELECT COUNT(*) as count FROM Conversation');
      return res[0]?.count || 0;
    },

    async findMany(opts = {}) {
      await getDb();
      let sql = 'SELECT * FROM Conversation WHERE 1=1';
      const params = [];
      if (opts.where?.memberId) {
        sql += ' AND memberId = ?';
        params.push(opts.where.memberId);
      }
      sql += ' ORDER BY lastMessageAt DESC';
      const convs = runQuery(sql, params);

      return convs.map((c) => {
        const profs = runQuery('SELECT id, name, slug, avatarUrl, bio FROM ManagedProfile WHERE id = ?', [c.profileId]);
        const members = runQuery('SELECT id, firstName, lastName, email, avatarUrl FROM User WHERE id = ?', [c.memberId]);
        const msgs = runQuery('SELECT * FROM Message WHERE conversationId = ? ORDER BY createdAt DESC LIMIT 1', [c.id]);
        const unreadRes = runQuery(
          'SELECT COUNT(*) as unread FROM Message WHERE conversationId = ? AND senderType = "ADMIN_PROFILE" AND readAt IS NULL',
          [c.id]
        );

        return {
          ...c,
          profile: profs[0] || null,
          member: members[0] || null,
          messages: msgs,
          _count: { messages: unreadRes[0]?.unread || 0 },
        };
      });
    },

    async findUnique(opts) {
      await getDb();
      let sql = 'SELECT * FROM Conversation WHERE ';
      const params = [];
      if (opts.where.id) {
        sql += 'id = ?';
        params.push(opts.where.id);
      } else if (opts.where.memberId_profileId) {
        sql += 'memberId = ? AND profileId = ?';
        params.push(opts.where.memberId_profileId.memberId, opts.where.memberId_profileId.profileId);
      }
      const res = runQuery(sql, params);
      if (!res[0]) return null;
      const c = res[0];
      const profs = runQuery('SELECT id, name, slug, avatarUrl, bio FROM ManagedProfile WHERE id = ?', [c.profileId]);
      const members = runQuery('SELECT id, firstName, lastName, email, avatarUrl FROM User WHERE id = ?', [c.memberId]);
      return {
        ...c,
        profile: profs[0] || null,
        member: members[0] || null,
      };
    },

    async create(opts) {
      await getDb();
      const id = generateCuid();
      const d = opts.data;
      const now = new Date().toISOString();
      runExec('INSERT INTO Conversation (id, memberId, profileId, status, lastMessageAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)', [
        id,
        d.memberId,
        d.profileId,
        d.status || 'ACTIVE',
        d.lastMessageAt ? new Date(d.lastMessageAt).toISOString() : now,
        now,
        now,
      ]);
      return prisma.conversation.findUnique({ where: { id } });
    },

    async update(opts) {
      await getDb();
      const d = opts.data;
      const sets = [];
      const params = [];
      for (const [k, v] of Object.entries(d)) {
        sets.push(`${k} = ?`);
        params.push(v instanceof Date ? v.toISOString() : v);
      }
      sets.push('updatedAt = ?');
      params.push(new Date().toISOString());
      params.push(opts.where.id);
      runExec(`UPDATE Conversation SET ${sets.join(', ')} WHERE id = ?`, params);
      return prisma.conversation.findUnique({ where: opts.where });
    },
  },

  message: {
    async findMany(opts = {}) {
      await getDb();
      let sql = 'SELECT * FROM Message WHERE 1=1';
      const params = [];
      if (opts.where?.conversationId) {
        sql += ' AND conversationId = ?';
        params.push(opts.where.conversationId);
      }
      sql += ' ORDER BY createdAt ASC';
      return runQuery(sql, params);
    },

    async create(opts) {
      await getDb();
      const id = generateCuid();
      const d = opts.data;
      const now = new Date().toISOString();
      runExec(
        'INSERT INTO Message (id, conversationId, senderType, senderUserId, content, isSystemGenerated, readAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, d.conversationId, d.senderType || 'MEMBER', d.senderUserId || null, d.content, d.isSystemGenerated ? 1 : 0, null, now]
      );
      return { id, ...d, createdAt: now };
    },

    async updateMany(opts = {}) {
      await getDb();
      let sql = 'UPDATE Message SET readAt = ? WHERE conversationId = ?';
      const params = [new Date().toISOString(), opts.where.conversationId];
      if (opts.where.senderType) {
        sql += ' AND senderType = ?';
        params.push(opts.where.senderType);
      }
      runExec(sql, params);
      return { count: 1 };
    },
  },

  invitation: {
    async count() {
      await getDb();
      const res = runQuery('SELECT COUNT(*) as count FROM Invitation');
      return res[0]?.count || 0;
    },

    async findUnique(opts) {
      await getDb();
      let sql = 'SELECT * FROM Invitation WHERE ';
      const params = [];
      if (opts.where.token) {
        sql += 'token = ?';
        params.push(opts.where.token);
      } else if (opts.where.id) {
        sql += 'id = ?';
        params.push(opts.where.id);
      }
      const res = runQuery(sql, params);
      return res[0] || null;
    },

    async findMany() {
      await getDb();
      return runQuery('SELECT * FROM Invitation ORDER BY createdAt DESC');
    },

    async create(opts) {
      await getDb();
      const id = generateCuid();
      const d = opts.data;
      const now = new Date().toISOString();
      runExec(
        'INSERT INTO Invitation (id, token, maxUses, currentUses, status, expiresAt, notes, createdByUserId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          d.token,
          d.maxUses || 1,
          d.currentUses || 0,
          d.status || 'ACTIVE',
          d.expiresAt ? new Date(d.expiresAt).toISOString() : null,
          d.notes || null,
          d.createdByUserId || null,
          now,
          now,
        ]
      );
      return { id, ...d, createdAt: now };
    },

    async update(opts) {
      await getDb();
      const d = opts.data;
      const sets = [];
      const params = [];
      for (const [k, v] of Object.entries(d)) {
        sets.push(`${k} = ?`);
        params.push(v instanceof Date ? v.toISOString() : v);
      }
      sets.push('updatedAt = ?');
      params.push(new Date().toISOString());
      params.push(opts.where.id);
      runExec(`UPDATE Invitation SET ${sets.join(', ')} WHERE id = ?`, params);
      return prisma.invitation.findUnique({ where: opts.where });
    },

    async delete(opts) {
      await getDb();
      runExec('DELETE FROM Invitation WHERE id = ?', [opts.where.id]);
      return { success: true };
    },
  },

  session: {
    async findUnique(opts) {
      await getDb();
      const res = runQuery('SELECT * FROM Session WHERE sessionToken = ?', [opts.where.sessionToken]);
      if (!res[0]) return null;
      const session = res[0];
      const users = runQuery('SELECT * FROM User WHERE id = ?', [session.userId]);
      return {
        ...session,
        expiresAt: new Date(session.expiresAt),
        user: users[0] || null,
      };
    },

    async create(opts) {
      await getDb();
      const id = generateCuid();
      const d = opts.data;
      const now = new Date().toISOString();
      runExec(
        'INSERT INTO Session (id, sessionToken, userId, expiresAt, ipAddress, userAgent, deviceId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          d.sessionToken,
          d.userId,
          d.expiresAt instanceof Date ? d.expiresAt.toISOString() : d.expiresAt,
          d.ipAddress || null,
          d.userAgent || null,
          d.deviceId || null,
          now,
        ]
      );
      return { id, ...d, createdAt: now };
    },

    async delete(opts) {
      await getDb();
      runExec('DELETE FROM Session WHERE id = ?', [opts.where.id]);
      return { success: true };
    },

    async deleteMany(opts = {}) {
      await getDb();
      if (opts.where?.sessionToken) {
        runExec('DELETE FROM Session WHERE sessionToken = ?', [opts.where.sessionToken]);
      } else if (opts.where?.userId) {
        runExec('DELETE FROM Session WHERE userId = ?', [opts.where.userId]);
      }
      return { count: 1 };
    },
  },

  notification: {
    async count(opts = {}) {
      await getDb();
      let sql = 'SELECT COUNT(*) as count FROM Notification WHERE userId = ?';
      const params = [opts.where.userId];
      if (opts.where.readAt === null) {
        sql += ' AND readAt IS NULL';
      }
      const res = runQuery(sql, params);
      return res[0]?.count || 0;
    },

    async findMany(opts = {}) {
      await getDb();
      let sql = 'SELECT * FROM Notification WHERE userId = ? ORDER BY createdAt DESC';
      const params = [opts.where.userId];
      if (opts.take) {
        sql += ` LIMIT ${parseInt(opts.take, 10)}`;
      }
      return runQuery(sql, params);
    },

    async create(opts) {
      await getDb();
      const id = generateCuid();
      const d = opts.data;
      const now = new Date().toISOString();
      runExec(
        'INSERT INTO Notification (id, userId, type, title, message, linkUrl, readAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, d.userId, d.type, d.title, d.message, d.linkUrl || null, null, now]
      );
      return { id, ...d, createdAt: now };
    },

    async updateMany(opts = {}) {
      await getDb();
      let sql = 'UPDATE Notification SET readAt = ? WHERE userId = ?';
      const params = [new Date().toISOString(), opts.where.userId];
      if (opts.where.id) {
        sql += ' AND id = ?';
        params.push(opts.where.id);
      }
      runExec(sql, params);
      return { count: 1 };
    },
  },

  adminAuditLog: {
    async findMany() {
      await getDb();
      const logs = runQuery('SELECT * FROM AdminAuditLog ORDER BY createdAt DESC LIMIT 100');
      return logs.map((log) => {
        let adminUser = null;
        if (log.adminUserId) {
          const u = runQuery('SELECT id, email, firstName, lastName, role FROM User WHERE id = ?', [log.adminUserId]);
          adminUser = u[0] || null;
        }
        return {
          ...log,
          adminUser,
        };
      });
    },

    async create(opts) {
      await getDb();
      const id = generateCuid();
      const d = opts.data;
      const now = new Date().toISOString();
      runExec(
        'INSERT INTO AdminAuditLog (id, adminUserId, action, targetType, targetId, detailsJson, ipAddress, userAgent, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          d.adminUserId || null,
          d.action,
          d.targetType || null,
          d.targetId || null,
          d.detailsJson || null,
          d.ipAddress || null,
          d.userAgent || null,
          now,
        ]
      );
      return { id, ...d, createdAt: now };
    },
  },

  siteSetting: {
    async findMany() {
      await getDb();
      return runQuery('SELECT * FROM SiteSetting');
    },

    async upsert(opts) {
      await getDb();
      const key = opts.where.key;
      const value = opts.update.value || opts.create.value;
      const now = new Date().toISOString();
      const existing = runQuery('SELECT * FROM SiteSetting WHERE key = ?', [key]);
      if (existing.length > 0) {
        runExec('UPDATE SiteSetting SET value = ?, updatedAt = ? WHERE key = ?', [value, now, key]);
      } else {
        const id = generateCuid();
        runExec('INSERT INTO SiteSetting (id, key, value, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)', [
          id,
          key,
          value,
          now,
          now,
        ]);
      }
      return { key, value };
    },
  },

  commentReport: {
    async count() {
      await getDb();
      const res = runQuery('SELECT COUNT(*) as count FROM CommentReport WHERE status = "PENDING"');
      return res[0]?.count || 0;
    },
  },

  async $transaction(fn) {
    return fn(prisma);
  },
};

module.exports = { prisma, getDb, saveDb };
