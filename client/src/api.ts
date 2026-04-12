const BASE = '/api';

function getAuthHeader(): any {
  const token = sessionStorage.getItem('mio_auth_token');
  if (!token) return {};
  return { 'Authorization': `Bearer ${token}` };
}

export interface TypeStat {
  type: string;
  count: number;
  openCount: number;
  resolvedCount: number;
  clients: string[];
}

export interface CategoryStat {
  category: string;
  count: number;
  openCount: number;
  resolvedCount: number;
  types: TypeStat[];
}

export interface CallRow {
  executionId: string;
  client: string;
  userNumber: string;
  duration: number;
  manualQc: string;
  missedByAi: string;
  category: string;
  type: string;
  status: 'open' | 'resolved';
}

export const api = {
  async getClients(): Promise<string[]> {
    const r = await fetch(`${BASE}/clients`, { headers: getAuthHeader() });
    const json = await r.json();
    return json.clients || [];
  },

  async getCategories(client?: string): Promise<CategoryStat[]> {
    const url = client
      ? `${BASE}/categories?client=${encodeURIComponent(client)}`
      : `${BASE}/categories`;
    const r = await fetch(url, { headers: getAuthHeader() });
    const json = await r.json();
    return json.data || [];
  },

  async getCalls(category: string, type: string, client?: string): Promise<CallRow[]> {
    let url = `${BASE}/calls?category=${encodeURIComponent(category)}&type=${encodeURIComponent(type)}`;
    if (client) url += `&client=${encodeURIComponent(client)}`;
    const r = await fetch(url, { headers: getAuthHeader() });
    const json = await r.json();
    return json.data || [];
  },

  async updateStatus(
    executionId: string, client: string, category: string,
    type: string, status: 'open' | 'resolved'
  ): Promise<void> {
    await fetch(`${BASE}/issue-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ executionId, client, category, type, status }),
    });
  },
};
