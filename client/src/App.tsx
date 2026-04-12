import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { api, CategoryStat, TypeStat, CallRow } from './api';
import Metrics from './Metrics';
import LoginPage from './LoginPage';
import { decryptResponse } from './crypto';

// ── Helpers ───────────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  User_Behaviour:    '#f97316',
  Agent_Performance: '#3b82f6',
  STT_Issue:         '#f59e0b',
  TTS_Pronunciation: '#10b981',
  Technical_Network: '#ef4444',
  System_Detection:  '#8b5cf6',
  Multiple_Issues:   '#06b6d4',
  Other:             '#94a3b8',
};

function catColor(c: string) { return CAT_COLORS[c] || CAT_COLORS.Other; }

function catClass(c: string) {
  return 'cb cb-' + c.replace(/[\s/]+/g, '_').replace(/[^a-zA-Z_]/g, '');
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function CatBadge({ cat }: { cat: string }) {
  return <span className={catClass(cat)}>{cat.replace(/_/g, ' ')}</span>;
}

function StatCard({ label, value, sub, variant }: {
  label: string; value: string | number; sub?: string; variant?: 'red' | 'green' | 'purple';
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-lbl">{label}</div>
      <div className={`stat-card-val${variant ? ' ' + variant : ''}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}

const EXCLUDE_CLIENTS = ['Master data ', 'Clients ', 'Report '];
const EXCLUDED_FROM_METRICS = ['User_Behaviour'];

// ── Category Overview ─────────────────────────────────────────────────────────

function CategoryTable({ categories, loading, onSelect }: {
  categories: CategoryStat[];
  loading: boolean;
  onSelect: (c: CategoryStat) => void;
}) {
  if (loading) {
    return <div className="loader"><div className="spinner" />Loading data from Google Sheets…</div>;
  }

  const totalIssues = categories.reduce((s, c) => s + c.count, 0);

  if (!categories.length) return (
    <div>
      <div className="empty">No data found for the selected filters.</div>
    </div>
  );

  return (
    <div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th style={{ width: 4, padding: 0 }} />
              <th>Category</th>
              <th>Occurrences</th>
              <th>Share of Total</th>
              <th>Open</th>
              <th>Resolved</th>
              <th>Resolution %</th>
              <th>Types</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => {
              const resolutionPct = cat.count > 0 ? Math.round((cat.resolvedCount / cat.count) * 100) : 0;
              const sharePct      = totalIssues > 0 ? Math.round((cat.count / totalIssues) * 100) : 0;
              const color         = catColor(cat.category);
              return (
                <tr key={cat.category} onClick={() => onSelect(cat)}>
                  {/* Colored left accent */}
                  <td style={{ padding: 0, width: 4 }}>
                    <div style={{ width: 4, minHeight: 52, background: color }} />
                  </td>
                  <td>
                    <CatBadge cat={cat.category} />
                  </td>
                  <td>
                    <span className="cnt">{cat.count.toLocaleString()}</span>
                  </td>
                  <td style={{ minWidth: 130 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="prog-wrap" style={{ width: 80 }}>
                        <div className="prog-bar cat" style={{ width: `${sharePct}%`, background: color }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#64748b', minWidth: 28 }}>{sharePct}%</span>
                    </div>
                  </td>
                  <td><span className="cnt-sm cnt-open">{cat.openCount.toLocaleString()}</span></td>
                  <td><span className="cnt-sm cnt-res">{cat.resolvedCount.toLocaleString()}</span></td>
                  <td style={{ minWidth: 150 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="prog-wrap" style={{ flex: 1 }}>
                        <div className="prog-bar green" style={{ width: `${resolutionPct}%` }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#64748b', width: 34, textAlign: 'right' }}>
                        {resolutionPct}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#6c63ff', fontWeight: 700, fontSize: 13 }}>
                      {cat.types.length} types
                      <span style={{ fontSize: 15 }}>→</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Issue Types under a Category ──────────────────────────────────────────────

function TypesTable({ category, clientFilter, onBack, onSelectType }: {
  category: CategoryStat;
  clientFilter: string;
  onBack: () => void;
  onSelectType: (t: TypeStat) => void;
}) {
  const sorted  = [...category.types].sort((a, b) => b.count - a.count);
  const maxCount = sorted[0]?.count || 1;
  const color    = catColor(category.category);
  const resRate  = category.count > 0 ? Math.round((category.resolvedCount / category.count) * 100) : 0;

  return (
    <div>
      <div className="breadcrumb">
        <span className="bc-link" onClick={onBack}>All Categories</span>
        <span className="bc-sep">›</span>
        <span className="bc-cur">{category.category.replace(/_/g, ' ')}</span>
      </div>

      <div className="detail-hdr">
        <h1>{category.category.replace(/_/g, ' ')}</h1>
        <CatBadge cat={category.category} />
      </div>
      <p className="detail-sub">
        {clientFilter || 'All Clients'} · {category.count.toLocaleString()} total occurrences
      </p>

      <div className="stat-cards">
        <StatCard label="Total Occurrences" value={category.count} sub={clientFilter || 'All Clients'} />
        <StatCard label="Open" value={category.openCount} variant="red" sub="unresolved" />
        <StatCard label="Resolved" value={category.resolvedCount} variant="green" sub={`${resRate}% resolution rate`} />
        <StatCard label="Issue Types" value={sorted.length} sub="distinct types" />
      </div>

      <div className="card">
        <div className="card-hdr">
          <div>
            <h2>{category.category.replace(/_/g, ' ')} — Issue Types ({sorted.length})</h2>
            <p>Click any row to see all individual calls for that issue type</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: 48 }}>#</th>
              <th>Issue Type</th>
              <th>Occurrences</th>
              <th>Open</th>
              <th>Resolved</th>
              <th>Resolution %</th>
              <th>Clients Affected</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => {
              const typeResRate = t.count > 0 ? Math.round((t.resolvedCount / t.count) * 100) : 0;
              const rankBg =
                i === 0 ? '#fef3c7' : i === 1 ? '#f1f5f9' : i === 2 ? '#fef4e8' : '#f8f9fb';
              const rankColor =
                i === 0 ? '#d97706' : i === 1 ? '#475569' : i === 2 ? '#c2410c' : '#94a3b8';
              return (
                <tr key={t.type} onClick={() => onSelectType(t)}>
                  <td>
                    <span className="rank-badge" style={{ background: rankBg, color: rankColor }}>
                      {i + 1}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#1e1e2e', maxWidth: 300 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 3, height: 16, background: color, borderRadius: 2, flexShrink: 0 }} />
                      {t.type}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="prog-wrap" style={{ width: 80 }}>
                        <div className="prog-bar cat" style={{ width: `${(t.count / maxCount) * 100}%`, background: color }} />
                      </div>
                      <span className="cnt-sm">{t.count}</span>
                    </div>
                  </td>
                  <td><span className="cnt-sm cnt-open">{t.openCount}</span></td>
                  <td><span className="cnt-sm cnt-res">{t.resolvedCount}</span></td>
                  <td style={{ minWidth: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="prog-wrap" style={{ flex: 1 }}>
                        <div className="prog-bar green" style={{ width: `${typeResRate}%` }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#64748b', width: 32, textAlign: 'right' }}>
                        {typeResRate}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="chips">
                      {t.clients.slice(0, 4).map(c => (
                        <span key={c} className="chip">{c.trim()}</span>
                      ))}
                      {t.clients.length > 4 && (
                        <span className="chip">+{t.clients.length - 4}</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Calls for a Specific Issue Type ──────────────────────────────────────────

function CallsTable({ category, issueType, clientFilter, onBack, onBackAll }: {
  category: CategoryStat;
  issueType: TypeStat;
  clientFilter: string;
  onBack: () => void;
  onBackAll: () => void;
}) {
  const [calls, setCalls]         = useState<CallRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]       = useState('');
  const [updating, setUpdating]   = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    api.getCalls(category.category, issueType.type, clientFilter || undefined)
      .then(setCalls).finally(() => setLoading(false));
  }, [category.category, issueType.type, clientFilter]);

  const filtered = search
    ? calls.filter(c =>
        c.executionId.toLowerCase().includes(search.toLowerCase()) ||
        c.client.toLowerCase().includes(search.toLowerCase()) ||
        c.userNumber.includes(search)
      )
    : calls;

  const toggle = async (call: CallRow) => {
    const key = `${call.executionId}|${call.client}`;
    setUpdating(prev => new Set([...prev, key]));
    const next: 'open' | 'resolved' = call.status === 'open' ? 'resolved' : 'open';
    await api.updateStatus(call.executionId, call.client, call.category, call.type, next);
    setCalls(prev =>
      prev.map(c => c.executionId === call.executionId && c.client === call.client ? { ...c, status: next } : c)
    );
    setUpdating(prev => { const s = new Set(prev); s.delete(key); return s; });
  };

  const openCount     = calls.filter(c => c.status === 'open').length;
  const resolvedCount = calls.filter(c => c.status === 'resolved').length;

  const applySearch = () => setSearch(searchInput);
  const clearSearch = () => { setSearch(''); setSearchInput(''); };

  return (
    <div>
      <div className="breadcrumb">
        <span className="bc-link" onClick={onBackAll}>All Categories</span>
        <span className="bc-sep">›</span>
        <span className="bc-link" onClick={onBack}>{category.category.replace(/_/g, ' ')}</span>
        <span className="bc-sep">›</span>
        <span className="bc-cur">{issueType.type}</span>
      </div>

      <div className="detail-hdr">
        <h1>{issueType.type}</h1>
        <CatBadge cat={category.category} />
      </div>
      <p className="detail-sub">
        {clientFilter || 'All Clients'} · {calls.length} calls identified
      </p>

      <div className="stat-cards">
        <StatCard label="Total Calls" value={calls.length} sub="with this issue" />
        <StatCard label="Open" value={openCount} variant="red" sub="unresolved" />
        <StatCard label="Resolved" value={resolvedCount} variant="green" sub="marked resolved" />
      </div>

      <div className="calls-controls">
        <span className="calls-count">
          Showing {filtered.length} of {calls.length} calls
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="search-wrap" style={{ minWidth: 280 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              placeholder="Search Call ID, client, number…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applySearch()}
            />
          </div>
          <button className="btn btn-primary" onClick={applySearch}>Search</button>
          {search && (
            <button className="btn btn-ghost" onClick={clearSearch}>Clear</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div>
            <h2>"{issueType.type}" — All Calls ({filtered.length})</h2>
            <p>Toggle the switch on each row to mark an issue as resolved or re-open it</p>
          </div>
        </div>

        {loading ? (
          <div className="loader"><div className="spinner" />Loading calls…</div>
        ) : filtered.length === 0 ? (
          <div className="empty">No calls found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Call ID</th>
                <th>Client</th>
                <th>Number</th>
                <th>Duration</th>
                <th>Manual QC Notes</th>
                <th>Missed by AI</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((call, i) => {
                const key = `${call.executionId}|${call.client}`;
                return (
                  <tr key={i} className="static">
                    <td className="mono" title={call.executionId}>
                      {call.executionId.slice(0, 10)}…
                    </td>
                    <td>
                      <span className="chip">{call.client.trim()}</span>
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{call.userNumber}</td>
                    <td>
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: '#475569',
                        background: '#f8f9fb', padding: '3px 8px', borderRadius: 6,
                      }}>
                        {fmt(call.duration)}
                      </span>
                    </td>
                    <td className="note" title={call.manualQc}>{call.manualQc || '—'}</td>
                    <td className="note" title={call.missedByAi}>{call.missedByAi || '—'}</td>
                    <td>
                      <div className="tog-wrap">
                        <label className="tog">
                          <input
                            type="checkbox"
                            checked={call.status === 'resolved'}
                            disabled={updating.has(key)}
                            onChange={() => toggle(call)}
                          />
                          <span className="tog-slider" />
                        </label>
                        <span className={`tog-lbl ${call.status}`}>
                          {call.status === 'resolved' ? 'Resolved' : 'Open'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ height: 32 }} />
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────

export default function App() {
  const token = sessionStorage.getItem('mio_auth_token') || '';
  const [clients, setClients]         = useState<string[]>([]);
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]           = useState('');
  const [categories, setCategories]   = useState<CategoryStat[]>([]);
  const [metrics, setMetrics]         = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [view, setView]               = useState<'issues' | 'metrics'>('issues');
  const [selectedCategory, setSelectedCategory] = useState<CategoryStat | null>(null);
  const [selectedType, setSelectedType]         = useState<TypeStat | null>(null);

  const handleApiError = (err: any) => {
    if (err.status === 401) {
      sessionStorage.removeItem('mio_auth_token');
      window.location.reload();
    }
  };

  useEffect(() => {
    if (token) {
      api.getClients().then(setClients).catch(handleApiError);
    }
  }, [token]);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const qs = clientFilter ? `?client=${encodeURIComponent(clientFilter)}` : '';
      const [cats, metricsRes] = await Promise.all([
        api.getCategories(clientFilter || undefined),
        fetch(`/api/metrics${qs}`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
      ]);
      let metricsData = metricsRes.data;
      if (metricsData && typeof metricsData === 'object' && metricsData.iv) {
        metricsData = await decryptResponse(metricsData);
      }
      setCategories(cats);
      setMetrics(metricsData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setLoading(false);
    }
  }, [clientFilter, token]);

  useEffect(() => { if (token) loadCategories(); }, [loadCategories, token]);

  useEffect(() => {
    setSelectedCategory(null);
    setSelectedType(null);
  }, [clientFilter]);

  // Check auth - show login if no token
  if (!token) return <LoginPage />;

  const filteredCats = categories
    .filter(cat => {
      // Exclude non-agent issue categories from main view
      if (EXCLUDED_FROM_METRICS.includes(cat.category)) return false;
      if (statusFilter === 'open'     && cat.openCount === 0)     return false;
      if (statusFilter === 'resolved' && cat.resolvedCount === 0) return false;
      if (search && !cat.category.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => b.count - a.count);


  const goIssues = () => { setView('issues'); };
  const goMetrics = () => { setView('metrics'); };

  return (
    <div className="layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>QC Dashboard</h2>
          <p>Voice Agent Quality Control</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`${view === 'issues' ? 'active' : ''}`}
            onClick={() => { goIssues(); setSelectedCategory(null); setSelectedType(null); }}
            style={{ appearance: 'none', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', fontSize: 13, color: view === 'issues' ? '#fff' : '#64748b', textDecoration: 'none', borderRadius: 8, transition: 'all .15s', fontWeight: 500, cursor: 'pointer', width: '100%', textAlign: 'left' }}
          >
            📋 Issue Explorer
          </button>
          <button
            className={`${view === 'metrics' ? 'active' : ''}`}
            onClick={() => { goMetrics(); setSelectedCategory(null); setSelectedType(null); }}
            style={{ appearance: 'none', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', fontSize: 13, color: view === 'metrics' ? '#fff' : '#64748b', textDecoration: 'none', borderRadius: 8, transition: 'all .15s', fontWeight: 500, cursor: 'pointer', width: '100%', textAlign: 'left' }}
          >
            📊 Analytics
          </button>
        </nav>

        <hr className="sidebar-sep" />

        <div className="sidebar-section">
          <span className="sidebar-section-lbl">Filter by Client</span>
          <select
            className="sidebar-select"
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
          >
            <option value="">All Clients</option>
            {clients
              .filter(c => !EXCLUDE_CLIENTS.includes(c))
              .map(c => <option key={c} value={c}>{c.trim()}</option>)
            }
          </select>
        </div>

        <div className="sidebar-section">
          <span className="sidebar-section-lbl">{clientFilter ? clientFilter.trim() : 'All Clients'}</span>
          {metrics ? (
            <>
              <div className="sidebar-stat">
                <span className="sidebar-stat-lbl">Total Issues</span>
                <span className="sidebar-stat-val">{metrics.summary.totalOccurrences.toLocaleString()}</span>
              </div>
              <div className="sidebar-stat">
                <span className="sidebar-stat-lbl">Open</span>
                <span className="sidebar-stat-val red">{metrics.summary.totalOpen.toLocaleString()}</span>
              </div>
              <div className="sidebar-stat">
                <span className="sidebar-stat-lbl">Resolved</span>
                <span className="sidebar-stat-val green">{metrics.summary.totalResolved.toLocaleString()}</span>
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Loading...</div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main">
        {view === 'metrics' ? (
          <Metrics clientFilter={clientFilter} />

        ) : selectedCategory && selectedType ? (
          <CallsTable
            category={selectedCategory}
            issueType={selectedType}
            clientFilter={clientFilter}
            onBack={() => setSelectedType(null)}
            onBackAll={() => { setSelectedType(null); setSelectedCategory(null); }}
          />

        ) : selectedCategory ? (
          <TypesTable
            category={selectedCategory}
            clientFilter={clientFilter}
            onBack={() => setSelectedCategory(null)}
            onSelectType={t => setSelectedType(t)}
          />

        ) : (
          <>
            <div className="page-header">
              <h1>Issue Explorer</h1>
              <p>Category-level overview · click any row to drill into issue types, then into individual calls</p>
            </div>

            {metrics && (
              <div className="stat-cards">
                <StatCard label="Total Calls QCed" value={metrics.summary.totalQcDone} sub="all calls reviewed" />
                <StatCard label="Total Issues" value={metrics.summary.totalOccurrences} sub="agent-related" variant="purple" />
                <StatCard label="Open Issues" value={metrics.summary.totalOpen} sub="unresolved" variant="red" />
                <StatCard label="Resolved" value={metrics.summary.totalResolved} sub="marked done" variant="green" />
                <StatCard label="Resolution Rate" value={`${metrics.summary.resolutionRate}%`} sub={metrics.summary.resolutionRate > 50 ? 'on track' : 'needs focus'} variant={metrics.summary.resolutionRate > 50 ? 'green' : 'red'} />
              </div>
            )}

            <div className="filter-bar">
              <div className="search-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  placeholder="Search categories…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select className="fsel" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="open">Has Open Issues</option>
                <option value="resolved">Has Resolved</option>
              </select>
            </div>

            <CategoryTable categories={filteredCats} loading={loading} onSelect={setSelectedCategory} />
          </>
        )}
      </main>
    </div>
  );
}
