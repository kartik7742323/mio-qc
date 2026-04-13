const { google } = require('googleapis');
const config = require('../config');

class SheetsService {
  constructor() {
    this.auth = new google.auth.GoogleAuth({
      credentials: config.CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  async getAllClients() {
    try {
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: config.SPREADSHEET_ID,
      });

      return spreadsheet.data.sheets
        .filter((s) => !config.EXCLUDE_SHEETS.includes(s.properties.title.trim()))
        .map((s) => s.properties.title);
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  }

  async getMasterData() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: config.SPREADSHEET_ID,
        range: 'Sheet2!A:Z',
      });

      const values = response.data.values || [];
      const headers = values[0] || [];

      // Build master data structure: category -> [types]
      const masterData = {};

      headers.forEach((category, categoryIdx) => {
        if (!category || category.trim() === '') return;

        masterData[category] = [];
        for (let row = 1; row < values.length; row++) {
          if (values[row][categoryIdx]) {
            masterData[category].push(values[row][categoryIdx].trim());
          }
        }
      });

      return masterData;
    } catch (error) {
      console.error('Error fetching master data:', error);
      throw error;
    }
  }

  getColumnIndices(sheetName, headers) {
    // Check for overrides
    if (config.COLUMN_OVERRIDES[sheetName]) {
      return config.COLUMN_OVERRIDES[sheetName];
    }

    // Try to find columns by header name
    const categoryIdx = headers.findIndex(
      (h) => h && h.toLowerCase().replace(/\s+/g, '') === 'category'
    );
    const typeIdx = headers.findIndex(
      (h) => h && h.toLowerCase().replace(/\s+/g, '') === 'type'
    );

    // If not found, use defaults
    return {
      categoryIdx: categoryIdx !== -1 ? categoryIdx : config.DEFAULT_COLUMNS.categoryIdx,
      typeIdx: typeIdx !== -1 ? typeIdx : config.DEFAULT_COLUMNS.typeIdx,
    };
  }

  async getClientData(clientName) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: config.SPREADSHEET_ID,
        range: `'${clientName}'!A:L`,
      });

      const values = response.data.values || [];
      if (values.length === 0) return [];

      const headers = values[0];
      const columnIndices = this.getColumnIndices(clientName, headers);

      const data = [];
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (!row || row.length === 0) continue;

        const executionId = (row[config.DEFAULT_COLUMNS.executionIdIdx] || '').trim();
        if (!executionId) continue;

        const category = (row[columnIndices.categoryIdx] || '').trim();
        const type = (row[columnIndices.typeIdx] || '').trim();

        // Skip if both category and type are empty
        if (!category && !type) continue;

        data.push({
          executionId,
          userNumber: (row[config.DEFAULT_COLUMNS.userNumberIdx] || '').trim(),
          conversationType: (row[config.DEFAULT_COLUMNS.conversationTypeIdx] || '').trim(),
          duration: parseInt(row[config.DEFAULT_COLUMNS.durationIdx]) || 0,
          manualQc: (row[config.DEFAULT_COLUMNS.manualQcIdx] || '').trim(),
          missedByAi: (row[config.DEFAULT_COLUMNS.missedByAiIdx] || '').trim(),
          category,
          type,
          client: clientName,
        });
      }

      return data;
    } catch (error) {
      console.error(`Error fetching data for ${clientName}:`, error);
      return [];
    }
  }

  async getAllClientData() {
    try {
      const clients = await this.getAllClients();
      const allData = [];

      for (const client of clients) {
        const clientData = await this.getClientData(client);
        allData.push(...clientData);
      }

      return allData;
    } catch (error) {
      console.error('Error fetching all client data:', error);
      throw error;
    }
  }
}

module.exports = new SheetsService();
