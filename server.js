const express = require('express');
const cors = require('cors');
const path = require('path');
const databaseService = require('./services/databaseService');
const sheetsService = require('./services/sheetsService');
const analyticsService = require('./services/analyticsService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const buildPath = path.join(__dirname, 'client/build');
app.use(express.static(buildPath));

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
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await sheetsService.getAllClients();
    res.json({ success: true, clients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/categories?client=X  → category-level breakdown
app.get('/api/categories', async (req, res) => {
  try {
    const { client } = req.query;
    const data = await analyticsService.getCategoryBreakdown(client || null);
    res.json({ success: true, data });
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
    const data = await analyticsService.getCallsForType(
      decodeURIComponent(category),
      decodeURIComponent(type),
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

// GET /api/metrics?client=X  → full analytics for the metrics page
app.get('/api/metrics', async (req, res) => {
  try {
    const { client } = req.query;
    const cats = await analyticsService.getCategoryBreakdown(client || null);

    const totalOccurrences = cats.reduce((s, c) => s + c.count, 0);
    const totalOpen = cats.reduce((s, c) => s + c.openCount, 0);
    const totalResolved = cats.reduce((s, c) => s + c.resolvedCount, 0);

    // Top 10 issue types across all categories
    const allTypes = cats.flatMap(c => c.types.map(t => ({ ...t, category: c.category })));
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
      data: {
        summary: {
          totalOccurrences,
          totalOpen,
          totalResolved,
          resolutionRate: totalOccurrences > 0 ? Math.round((totalResolved / totalOccurrences) * 100) : 0,
          totalCategories: cats.length,
          totalUniqueTypes: allTypes.length,
        },
        categoryBreakdown: cats.map(c => ({
          category: c.category,
          count: c.count,
          openCount: c.openCount,
          resolvedCount: c.resolvedCount,
          pct: Math.round((c.count / totalOccurrences) * 100),
        })),
        top10Types,
        clientBreakdown: Object.values(clientMap).sort((a, b) => b.count - a.count),
        zeroResolution,
        crossClient,
      },
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
