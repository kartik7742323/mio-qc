import { useState, useEffect } from 'react';

interface MetricsData {
  summary: {
    totalOccurrences: number;
    totalOpen: number;
    totalResolved: number;
    resolutionRate: number;
    totalCategories: number;
    totalUniqueTypes: number;
  };
  categoryBreakdown: Array<{
    category: string; count: number;
    openCount: number; resolvedCount: number; pct: number;
  }>;
  excludedCategoryBreakdown: Array<{
    category: string; count: number;
    openCount: number; resolvedCount: number;
  }>;
  top10Types: Array<{
    type: string; category: string;
    count: number; openCount: number; resolvedCount: number; clients: string[];
  }>;
  clientBreakdown: Array<{
    client: string; count: number; topIssue: string; topCategory: string;
  }>;
}

interface CategoryDetail {
  category: string;
  count: number;
  types: Array<{ type: string; count: number; clients: string[] }>;
}

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
const CAT_BG: Record<string, string> = {
  User_Behaviour:    '#fff4ed',
  Agent_Performance: '#eff6ff',
  STT_Issue:         '#fefce8',
  TTS_Pronunciation: '#f0fdf4',
  Technical_Network: '#fef2f2',
  System_Detection:  '#f5f3ff',
  Multiple_Issues:   '#ecfeff',
  Other:             '#f1f5f9',
};

function catColor(c: string) { return CAT_COLORS[c] || '#94a3b8'; }
function catBg(c: string)    { return CAT_BG[c]    || '#f1f5f9'; }

function CatBadge({ cat }: { cat: string }) {
  return (
    <span style={{
      background: catBg(cat), color: catColor(cat),
      borderRadius: 20, padding: '3px 11px',
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      {cat.replace(/_/g, ' ')}
    </span>
  );
}

function KpiCard({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, border: '1px solid #eaecf0',
      padding: '18px 22px', boxShadow: '0 1px 3px rgba(0,0,0,.04)',
    }}>
      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: color || '#1e1e2e', lineHeight: 1 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: string; children: string }) {
  return (
    <div style={{
      fontSize: 15, fontWeight: 700, color: '#1e1e2e',
      margin: '32px 0 14px', paddingBottom: 10,
      borderBottom: '2px solid #f1f3f5',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span>{icon}</span> {children}
    </div>
  );
}

const EXCLUDE = ['Master data ', 'Clients ', 'Report '];

export default function Metrics({ clientFilter }: { clientFilter: string }) {
  const [data, setData]           = useState<MetricsData | null>(null);
  const [categories, setCategories] = useState<CategoryDetail[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = clientFilter ? `?client=${encodeURIComponent(clientFilter)}` : '';
    Promise.all([
      fetch(`/api/metrics${qs}`).then(r => r.json()),
      fetch(`/api/categories${qs}`).then(r => r.json()),
    ]).then(([metrics, cats]) => {
      setData(metrics.data);
      setCategories(cats.data || []);
      setLoading(false);
    });
  }, [clientFilter]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80, gap: 14, color: '#94a3b8' }}>
      <div className="spinner" />Loading analytics…
    </div>
  );
  if (!data) return null;

  const { summary, categoryBreakdown, top10Types, clientBreakdown } = data;
  const maxCat    = categoryBreakdown[0]?.count || 1;
  const maxType   = top10Types[0]?.count || 1;
  const filteredClients = clientBreakdown.filter(c => !EXCLUDE.includes(c.client));
  const maxClient = filteredClients[0]?.count || 1;

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e1e2e', letterSpacing: '-.5px' }}>
          Analytics
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 5 }}>
          {clientFilter ? `Client: ${clientFilter.trim()}` : 'All Clients'} · Identify and prioritise what to fix
        </p>
      </div>

      {/* ── 4 KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KpiCard label="Total Issues" value={summary.totalOccurrences} sub="occurrences logged" />
        <KpiCard
          label="Open"
          value={summary.totalOpen}
          color="#ef4444"
          sub="unresolved"
        />
        <KpiCard
          label="Resolved"
          value={summary.totalResolved}
          color="#10b981"
          sub="marked done"
        />
        <KpiCard
          label="Resolution Rate"
          value={`${summary.resolutionRate}%`}
          color={summary.resolutionRate > 50 ? '#10b981' : '#ef4444'}
          sub="of all issues"
        />
      </div>

      {/* ── Category Breakdown ── */}
      <SectionTitle icon="📊">Issue Distribution by Category</SectionTitle>
      <div style={{
        background: '#fff', borderRadius: 12, border: '1px solid #eaecf0',
        overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)',
      }}>
        {categoryBreakdown.map((cat, i) => {
          const color   = catColor(cat.category);
          const resRate = cat.count > 0 ? Math.round((cat.resolvedCount / cat.count) * 100) : 0;
          return (
            <div key={cat.category} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '13px 20px',
              borderBottom: i < categoryBreakdown.length - 1 ? '1px solid #f5f5f5' : 'none',
            }}>
              {/* Color accent */}
              <div style={{ width: 4, height: 32, borderRadius: 2, background: color, flexShrink: 0 }} />
              <div style={{ width: 190, flexShrink: 0 }}>
                <CatBadge cat={cat.category} />
              </div>
              {/* Occurrence bar */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 99, height: 7, overflow: 'hidden' }}>
                  <div style={{ width: `${(cat.count / maxCat) * 100}%`, height: 7, background: color, borderRadius: 99, transition: 'width .5s' }} />
                </div>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#1e1e2e', minWidth: 48, textAlign: 'right' }}>
                  {cat.count}
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 32 }}>{cat.pct}%</span>
              </div>
              {/* Open / Resolved */}
              <div style={{ display: 'flex', gap: 16, flexShrink: 0, fontSize: 12, minWidth: 180, justifyContent: 'flex-end' }}>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>{cat.openCount} open</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>{cat.resolvedCount} resolved</span>
                <span style={{ color: '#94a3b8' }}>{resRate}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Top 10 Priority Queue ── */}
      <SectionTitle icon="🔥">Top Issue Types — Priority Queue</SectionTitle>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eaecf0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fb', borderBottom: '1px solid #eaecf0' }}>
              {['#', 'Issue Type', 'Category', 'Occurrences', 'Open / Resolved', 'Clients Affected'].map(h => (
                <th key={h} style={{
                  padding: '10px 16px', textAlign: 'left',
                  fontSize: 10, fontWeight: 700, color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {top10Types.map((t, i) => {
              const barPct    = (t.count / maxType) * 100;
              const rankBg    = i === 0 ? '#fef3c7' : i === 1 ? '#f1f5f9' : i === 2 ? '#fef4e8' : '#f8f9fb';
              const rankColor = i === 0 ? '#d97706' : i === 1 ? '#475569' : i === 2 ? '#c2410c' : '#94a3b8';
              const visibleClients = t.clients.filter(c => !EXCLUDE.includes(c));
              return (
                <tr key={t.type} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 24, height: 24, borderRadius: 6,
                      background: rankBg, color: rankColor, fontSize: 11, fontWeight: 800,
                    }}>
                      {i + 1}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13, color: '#1e1e2e', maxWidth: 220 }}>
                    {t.type}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <CatBadge cat={t.category} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 90, background: '#f1f5f9', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${barPct}%`, height: 6, background: catColor(t.category), borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 17, fontWeight: 800, color: '#1e1e2e' }}>{t.count}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12, fontWeight: 700 }}>
                      <span style={{ color: '#ef4444' }}>{t.openCount} open</span>
                      <span style={{ color: '#10b981' }}>{t.resolvedCount} resolved</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {visibleClients.slice(0, 4).map(c => (
                        <span key={c} style={{
                          background: '#f0eeff', color: '#6c63ff',
                          borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 600,
                        }}>
                          {c.trim()}
                        </span>
                      ))}
                      {visibleClients.length > 4 && (
                        <span style={{ background: '#f0eeff', color: '#6c63ff', borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>
                          +{visibleClients.length - 4}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Issue Type Share per Category ── */}
      <SectionTitle icon="🗂️">Issue Type Breakdown by Category</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {[...categories].sort((a, b) => b.count - a.count).map(cat => {
          const color   = catColor(cat.category);
          const bg      = catBg(cat.category);
          const sorted  = [...cat.types].sort((a, b) => b.count - a.count);
          const topTypes = sorted.slice(0, 8);
          const restCount = sorted.slice(8).reduce((s, t) => s + t.count, 0);
          const maxInCat = sorted[0]?.count || 1;
          return (
            <div key={cat.category} style={{
              background: '#fff', borderRadius: 12,
              border: '1px solid #eaecf0', overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,.04)',
            }}>
              {/* Card header */}
              <div style={{
                padding: '12px 16px',
                background: bg,
                borderBottom: `2px solid ${color}22`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color }}>
                  {cat.category.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                  {cat.count} total · {sorted.length} types
                </span>
              </div>
              {/* Type rows */}
              <div style={{ padding: '10px 16px 12px' }}>
                {topTypes.map(t => {
                  const pct = Math.round((t.count / cat.count) * 100);
                  return (
                    <div key={t.type} style={{ marginBottom: 9 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{
                          fontSize: 12, color: '#1e1e2e', fontWeight: 500,
                          maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }} title={t.type}>
                          {t.type}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', flexShrink: 0, marginLeft: 8 }}>
                          {t.count} <span style={{ color: '#94a3b8', fontWeight: 500 }}>({pct}%)</span>
                        </span>
                      </div>
                      <div style={{ background: '#f1f5f9', borderRadius: 99, height: 5, overflow: 'hidden' }}>
                        <div style={{
                          width: `${(t.count / maxInCat) * 100}%`,
                          height: 5, background: color, borderRadius: 99,
                          transition: 'width .4s ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
                {restCount > 0 && (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, fontStyle: 'italic' }}>
                    +{sorted.length - 8} more types · {restCount} occurrences
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Issues per Client ── */}
      <SectionTitle icon="🏢">Issues per Client</SectionTitle>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eaecf0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
        {filteredClients.map((cl, i) => {
          const barPct = (cl.count / maxClient) * 100;
          return (
            <div key={cl.client} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '13px 20px',
              borderBottom: i < filteredClients.length - 1 ? '1px solid #f5f5f5' : 'none',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, width: 100, flexShrink: 0, color: '#1e1e2e' }}>
                {cl.client.trim()}
              </span>
              <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 99, height: 7, overflow: 'hidden' }}>
                <div style={{ width: `${barPct}%`, height: 7, background: '#6c63ff', borderRadius: 99, transition: 'width .5s' }} />
              </div>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#1e1e2e', minWidth: 44, textAlign: 'right' }}>
                {cl.count}
              </span>
              {cl.topIssue && (
                <span style={{ fontSize: 12, color: '#94a3b8', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Top: {cl.topIssue}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Other Categories (Not Agent Issues) ── */}
      {data.excludedCategoryBreakdown && data.excludedCategoryBreakdown.length > 0 && (
        <div>
          <div style={{
            fontSize: 13, fontWeight: 700, color: '#94a3b8',
            margin: '40px 0 12px', paddingBottom: 8,
            borderBottom: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>📝 Other (Non-Agent Issues)</span>
            <span style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 500 }}>Not tracked in main metrics</span>
          </div>
          <div style={{
            background: '#f8f9fb', borderRadius: 12, border: '1px solid #e2e8f0',
            overflow: 'hidden', boxShadow: 'none',
          }}>
            {data.excludedCategoryBreakdown.map((cat, i) => {
              const resRate = cat.count > 0 ? Math.round((cat.resolvedCount / cat.count) * 100) : 0;
              return (
                <div key={cat.category} style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '11px 16px',
                  borderBottom: i < data.excludedCategoryBreakdown.length - 1 ? '1px solid #e8eaed' : 'none',
                  background: i % 2 === 0 ? '#f8f9fb' : '#ffffff',
                }}>
                  <div style={{ width: 160, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                      {cat.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 20, flexShrink: 0, fontSize: 12 }}>
                    <span style={{ color: '#94a3b8' }}>{cat.count} occurrences</span>
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>{cat.openCount} open</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>{cat.resolvedCount} resolved</span>
                    <span style={{ color: '#94a3b8' }}>{resRate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ height: 32 }} />
    </div>
  );
}
