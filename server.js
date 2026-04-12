const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const databaseService = require('./services/databaseService');
const sheetsService = require('./services/sheetsService');
const analyticsService = require('./services/analyticsService');

const app = express();
const PORT = process.env.PORT || 5000;

// Auth constants
const AUTH_SECRET = 'MioAuth!Secret#2024@Meritto';
const ENC_KEY = Buffer.from('MioAdoption$Analytics#Key2024!XZ');
const USERNAME = 'product@meritto.com';
const PASSWORD = '1!2MIC#@!S5G3F>>__!@';

// Auth functions
function createToken() {
  const ts = Date.now().toString(16);
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(ts).digest('hex');
  return `${ts}.${sig}`;
}

function verifyToken(token) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [ts, sig] = parts;
  try {
    const expected = crypto.createHmac('sha256', AUTH_SECRET).update(ts).digest('hex');
    const sigBuf = Buffer.from(sig, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length) return false;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false;
    const age = Date.now() - parseInt(ts, 16);
    return age >= 0 && age < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function encrypt(obj) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const enc = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv: iv.toString('hex'), tag: tag.toString('hex'), data: enc.toString('hex') };
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!verifyToken(token)) return res.status(401).json({ success: false, error: 'Unauthorized' });
  next();
}

app.use(cors());
app.use(express.json());

const buildPath = path.join(__dirname, 'client/build');
app.use(express.static(buildPath));

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username !== USERNAME || password !== PASSWORD) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
  res.json({ success: true, token: createToken() });
});

async function initializeServer() {
  try {
    await databaseService.init();
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}
initializeServer();

// Get all clients
app.get('/api/clients', requireAuth, async (req, res) => {
  try {
    const clients = await sheetsService.getAllClients();
    res.json({ success: true, data: encrypt({ clients }) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/categories?client=X  → category-level breakdown
app.get('/api/categories', requireAuth, async (req, res) => {
  try {
    const { client } = req.query;
    const allData = await analyticsService.getCategoryBreakdown(client || null);
    // Filter out excluded categories and types
    const data = allData
      .filter(c => !EXCLUDED_FROM_METRICS.includes(c.category))
      .map(c => ({
        ...c,
        count: c.count - (c.types.filter(t => EXCLUDED_TYPES.includes(t.type)).reduce((s, t) => s + t.count, 0) || 0),
        openCount: c.openCount - (c.types.filter(t => EXCLUDED_TYPES.includes(t.type)).reduce((s, t) => s + t.openCount, 0) || 0),
        resolvedCount: c.resolvedCount - (c.types.filter(t => EXCLUDED_TYPES.includes(t.type)).reduce((s, t) => s + t.resolvedCount, 0) || 0),
        types: c.types.filter(t => !EXCLUDED_TYPES.includes(t.type)),
      }));
    res.json({ success: true, data: encrypt({ data }) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/calls?category=X&type=Y&client=Z  → calls for that type
app.get('/api/calls', async (req, res) => {
  try {
    const { category, type, client } = req.query;
    if (!category || !type) {
      return res.status(400).json({ success: false, error: 'category and type required' });
    }
    const decodedType = decodeURIComponent(type);
    // Block access to excluded types
    if (EXCLUDED_TYPES.includes(decodedType)) {
      return res.json({ success: true, data: [] });
    }
    const data = await analyticsService.getCallsForType(
      decodeURIComponent(category),
      decodedType,
      client || null
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/issue-status  → update open/resolved
app.post('/api/issue-status', async (req, res) => {
  try {
    const { executionId, client, category, type, status } = req.body;
    if (!executionId || !client || !status) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    await databaseService.updateIssueStatus(executionId, client, category || '', type || '', status);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Categories to exclude from main metrics (less prominent)
const EXCLUDED_FROM_METRICS = ['User_Behaviour'];
// Issue types to exclude (not agent issues)
const EXCLUDED_TYPES = ['Voicemail Detected'];

// GET /api/metrics?client=X  → full analytics for the metrics page
app.get('/api/metrics', requireAuth, async (req, res) => {
  try {
    const { client } = req.query;
    const allCats = await analyticsService.getCategoryBreakdown(client || null);

    // Total QC done = unique count of calls QC'd (includes user issues, voicemail, everything)
    const totalQcDone = await analyticsService.getTotalCallsQced(client || null);

    // Separate main categories from excluded ones
    const cats = allCats.filter(c => !EXCLUDED_FROM_METRICS.includes(c.category));
    const excludedCats = allCats.filter(c => EXCLUDED_FROM_METRICS.includes(c.category));

    // Filter out excluded types from all categories
    const catsWithoutExcludedTypes = cats.map(cat => ({
      ...cat,
      count: cat.count - (cat.types.filter(t => EXCLUDED_TYPES.includes(t.type)).reduce((s, t) => s + t.count, 0) || 0),
      openCount: cat.openCount - (cat.types.filter(t => EXCLUDED_TYPES.includes(t.type)).reduce((s, t) => s + t.openCount, 0) || 0),
      resolvedCount: cat.resolvedCount - (cat.types.filter(t => EXCLUDED_TYPES.includes(t.type)).reduce((s, t) => s + t.resolvedCount, 0) || 0),
      types: cat.types.filter(t => !EXCLUDED_TYPES.includes(t.type)),
    }));

    // Main metrics (excluding non-agent issues from totals)
    const totalOccurrences = catsWithoutExcludedTypes.reduce((s, c) => s + c.count, 0);
    const totalOpen = catsWithoutExcludedTypes.reduce((s, c) => s + c.openCount, 0);
    const totalResolved = catsWithoutExcludedTypes.reduce((s, c) => s + c.resolvedCount, 0);

    // Top 10 issue types across all categories
    const allTypes = catsWithoutExcludedTypes.flatMap(c => c.types.map(t => ({ ...t, category: c.category })));
    const top10Types = allTypes.sort((a, b) => b.count - a.count).slice(0, 10);

    // Per-client issue counts
    const clientMap = {};
    allTypes.forEach(t => {
      t.clients.forEach(cl => {
        if (!clientMap[cl]) clientMap[cl] = { client: cl, count: 0, topIssue: '' };
        clientMap[cl].count += t.count;
      });
    });
    // Find top issue per client
    cats.forEach(cat => cat.types.forEach(t => {
      t.clients.forEach(cl => {
        if (!clientMap[cl]) return;
        if (!clientMap[cl].topIssue || t.count > (clientMap[cl].topIssueCount || 0)) {
          clientMap[cl].topIssue = t.type;
          clientMap[cl].topIssueCount = t.count;
          clientMap[cl].topCategory = cat.category;
        }
      });
    }));

    // Issues with 0% resolution (priority)
    const zeroResolution = allTypes
      .filter(t => t.resolvedCount === 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Cross-client issues (appear in 3+ clients)
    const crossClient = allTypes
      .filter(t => t.clients.length >= 3)
      .sort((a, b) => b.clients.length - a.clients.length)
      .slice(0, 8);

    res.json({
      success: true,
      data: encrypt({
        summary: {
          totalQcDone,
          totalOccurrences,
          totalOpen,
          totalResolved,
          resolutionRate: totalOccurrences > 0 ? Math.round((totalResolved / totalOccurrences) * 100) : 0,
          totalCategories: cats.length,
          totalUniqueTypes: allTypes.length,
        },
        categoryBreakdown: catsWithoutExcludedTypes
          .map(c => ({
            category: c.category,
            count: c.count,
            openCount: c.openCount,
            resolvedCount: c.resolvedCount,
            pct: totalOccurrences > 0 ? Math.round((c.count / totalOccurrences) * 100) : 0,
          }))
          .sort((a, b) => b.count - a.count),
        excludedCategoryBreakdown: excludedCats.map(c => ({
          category: c.category,
          count: c.count,
          openCount: c.openCount,
          resolvedCount: c.resolvedCount,
        })),
        top10Types,
        clientBreakdown: Object.values(clientMap).sort((a, b) => b.count - a.count),
        zeroResolution,
        crossClient,
      }),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/health', (req, res) => res.json({ success: true }));

// Catch-all → React
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server on http://localhost:${PORT}`);
  console.log(`📁 Serving React from ${buildPath}`);
});

process.on('SIGINT', async () => {
  await databaseService.close();
  process.exit(0);
});
