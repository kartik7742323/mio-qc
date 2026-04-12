const { google } = require('googleapis');
require('dotenv').config();

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);
const EXCLUDE_SHEETS = ['Sheet2', 'Master data', 'Clients', 'Report', 'Client_Owner'];

const auth = new google.auth.GoogleAuth({
  credentials: CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function countCalls() {
  try {
    // Get all sheets
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const clientSheets = spreadsheet.data.sheets
      .filter((s) => !EXCLUDE_SHEETS.includes(s.properties.title))
      .map((s) => s.properties.title);

    console.log('Client sheets found:', clientSheets);
    console.log('---');

    const uniqueExecutionIds = new Set();
    let totalRows = 0;

    // Fetch data from each client
    for (const client of clientSheets) {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${client}'!A:L`,
      });

      const values = response.data.values || [];
      const dataRows = values.slice(1); // Skip header

      console.log(`${client}: ${dataRows.length} rows`);
      
      for (const row of dataRows) {
        if (row && row[0]) { // Column A = Execution ID
          const executionId = row[0].trim();
          if (executionId) {
            uniqueExecutionIds.add(executionId);
            totalRows++;
          }
        }
      }
    }

    console.log('---');
    console.log(`Total rows with execution IDs: ${totalRows}`);
    console.log(`Total UNIQUE execution IDs (Total Calls QCed): ${uniqueExecutionIds.size}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

countCalls();
