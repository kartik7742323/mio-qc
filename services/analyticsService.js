const sheetsService = require('./sheetsService');
const databaseService = require('./databaseService');
const { normalizeRow } = require('./masterData');

class AnalyticsService {

  // Build status lookup map for a client
  async buildStatusMap(client) {
    const statuses = await databaseService.getAllIssueStatuses(client);
    const map = {};
    statuses.forEach(s => {
      map[`${s.execution_id}|${s.category}|${s.type}`] = s.status;
    });
    return map;
  }

  /**
   * Get total count of unique calls QC'd (including all issues: user, agent, system, voicemail)
   */
  async getTotalCallsQced(clientFilter = null) {
    const clients = clientFilter
      ? [clientFilter]
      : await sheetsService.getAllClients();

    const uniqueExecutionIds = new Set();

    for (const client of clients) {
      const rows = await sheetsService.getClientData(client);
      rows.forEach(row => {
        // Count ANY call that has ANY category or type (not empty both)
        uniqueExecutionIds.add(row.executionId);
      });
    }

    return uniqueExecutionIds.size;
  }

  /**
   * Get aggregated data grouped by CATEGORY (highest level).
   * Each category has a count of total issues, open, resolved,
   * and a breakdown of issue types underneath.
   *
   * @param {string|null} clientFilter - filter to one client, or null for all
   */
  async getCategoryBreakdown(clientFilter = null) {
    const clients = clientFilter
      ? [clientFilter]
      : await sheetsService.getAllClients();

    // category → { count, openCount, resolvedCount, types: { typeName → {count, open, resolved} } }
    const categoryMap = {};

    for (const client of clients) {
      const rows = await sheetsService.getClientData(client);
      const statusMap = await this.buildStatusMap(client);

      for (const row of rows) {
        // normalizeRow handles comma-separated multi-issue cells, typos, case variants, clean calls
        const normalized = normalizeRow(row.category, row.type, row.manualQc, row.missedByAi);
        if (!normalized.length) continue;

        // Count each category and type ONCE per row (not per issue instance)
        const categoriesInRow = new Set();
        const typesInRow = {};  // category -> Set of types

        for (const { type, category } of normalized) {
          categoriesInRow.add(category);
          if (!typesInRow[category]) typesInRow[category] = new Set();
          typesInRow[category].add(type);
        }

        // Now count each category/type once per row
        for (const category of categoriesInRow) {
          if (!categoryMap[category]) {
            categoryMap[category] = { category, count: 0, openCount: 0, resolvedCount: 0, types: {} };
          }
          // Count the row once for this category
          categoryMap[category].count++;

          // For status, check if any instance of this category in row is resolved
          const categoryStatuses = normalized
            .filter(n => n.category === category)
            .map(n => statusMap[`${row.executionId}|${n.category}|${n.type}`] || 'open');

          const isResolved = categoryStatuses.every(s => s === 'resolved');
          if (isResolved && categoryStatuses.length > 0) {
            categoryMap[category].resolvedCount++;
          } else {
            categoryMap[category].openCount++;
          }

          // Count types once per row per category
          for (const type of typesInRow[category]) {
            if (!categoryMap[category].types[type]) {
              categoryMap[category].types[type] = { type, count: 0, openCount: 0, resolvedCount: 0, clients: new Set() };
            }
            categoryMap[category].types[type].count++;
            categoryMap[category].types[type].clients.add(client);

            const typeStatus = statusMap[`${row.executionId}|${category}|${type}`] || 'open';
            if (typeStatus === 'resolved') {
              categoryMap[category].types[type].resolvedCount++;
            } else {
              categoryMap[category].types[type].openCount++;
            }
          }
        }
      }
    }

    // Convert to sorted arrays
    return Object.values(categoryMap)
      .map(cat => ({
        ...cat,
        types: Object.values(cat.types)
          .map(t => ({ ...t, clients: Array.from(t.clients) }))
          .sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get all calls for a specific category+type combination.
   */
  async getCallsForType(category, type, clientFilter = null) {
    const clients = clientFilter
      ? [clientFilter]
      : await sheetsService.getAllClients();

    const calls = [];

    for (const client of clients) {
      const rows = await sheetsService.getClientData(client);
      const statusMap = await this.buildStatusMap(client);

      for (const row of rows) {
        const normalized = normalizeRow(row.category, row.type, row.manualQc, row.missedByAi);
        const match = normalized.find(n => n.category === category && n.type === type);
        if (!match) continue;

        const statusKey = `${row.executionId}|${category}|${type}`;
        const status = statusMap[statusKey] || 'open';

        calls.push({
          executionId: row.executionId,
          client,
          userNumber: row.userNumber,
          duration: row.duration,
          manualQc: row.manualQc,
          missedByAi: row.missedByAi,
          category,
          type,
          status,
        });
      }
    }

    return calls;
  }
}

module.exports = new AnalyticsService();
