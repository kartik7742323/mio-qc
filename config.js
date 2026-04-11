require('dotenv').config();

if (!process.env.GOOGLE_CREDENTIALS || !process.env.SPREADSHEET_ID) {
  throw new Error(
    'Missing env vars: GOOGLE_CREDENTIALS and SPREADSHEET_ID are required.\n' +
    'Create a .env file locally or set them in your Vercel project settings.'
  );
}

module.exports = {
  SPREADSHEET_ID: process.env.SPREADSHEET_ID,

  CREDENTIALS: JSON.parse(process.env.GOOGLE_CREDENTIALS),

  EXCLUDE_SHEETS: ['Sheet2', 'Master data', 'Clients', 'Report', 'Client_Owner'],

  COLUMN_OVERRIDES: {
    'Lexicon Mile': { categoryIdx: 9, typeIdx: 10 },
    'Woxsen':       { categoryIdx: 9, typeIdx: 10 },
  },

  DEFAULT_COLUMNS: {
    executionIdIdx:      0,
    userNumberIdx:       1,
    conversationTypeIdx: 2,
    durationIdx:         3,
    manualQcIdx:         4,
    missedByAiIdx:       5,
    categoryIdx:         6,
    typeIdx:             7,
  },

  // On Vercel, filesystem is read-only except /tmp
  DB_PATH: process.env.VERCEL ? '/tmp/qc_issues.db' : './qc_issues.db',
};
