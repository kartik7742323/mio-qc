# QC Issues Dashboard

A comprehensive dashboard for tracking and managing voice agent QC issues across multiple clients. Features real-time data integration with Google Sheets, issue categorization, and status management.

## Features

- **Multi-Client Support**: View QC data for all clients from a single dashboard
- **Real-Time Data Sync**: Automatic integration with Google Sheets API
- **Issue Tracking**: Track issues by category with open/resolved status
- **Metrics & Analytics**: 
  - Total calls analyzed
  - Calls with issues vs. clean calls
  - Open vs. resolved issues
  - Issues breakdown by category
- **Drill-Down View**: Click on any category to see all calls with those issues
- **Issue Management**: Mark individual issues as resolved or re-open them
- **Smart Data Parsing**: Handles varying column positions across different client sheets

## Project Structure

```
qc-dashboard/
├── server.js                 # Express backend server
├── config.js                 # Configuration and credentials
├── services/
│   ├── sheetsService.js     # Google Sheets API integration
│   ├── databaseService.js   # SQLite database for issue status
│   └── analyticsService.js  # Analytics and data processing
├── client/
│   ├── src/
│   │   ├── App.tsx          # Main React component
│   │   ├── api.ts           # API client
│   │   ├── components/
│   │   │   ├── Dashboard.tsx      # Metrics view
│   │   │   └── CategoryDetail.tsx # Drill-down view
│   │   └── styles...
│   └── package.json
└── package.json
```

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Google Service Account credentials (already configured)

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Verify Google Sheets Access:**
   - The Google Sheets API credentials are already configured in `config.js`
   - Make sure the service account has access to the spreadsheet

### Running the Application

**Option 1: Run both backend and frontend together**
```bash
npm run dev
```

**Option 2: Run backend and frontend separately**

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run client
```

The application will be available at `http://localhost:3000`

## How to Use

### Dashboard Overview
1. **Select a Client**: Use the dropdown to choose which client's data to view
2. **View Metrics**: See at a glance:
   - Total calls analyzed
   - Calls with issues vs. clean calls
   - Total/open/resolved issues
   - Issues breakdown by category

### Explore Issues by Category
1. **Click a Category Card**: Select any issue category to drill down
2. **View Call Details**: Each call shows:
   - Execution ID and call metadata
   - Manual QC notes
   - Missed By AI notes
   - All issues in that call
3. **Manage Status**: For each issue:
   - Click "Mark Resolved" to resolve an issue
   - Click "Mark Open" to re-open a resolved issue
   - Status updates are saved instantly

### Data Structure

#### Master Sheet (Sheet2)
- **Purpose**: Defines valid issue categories and types
- **Format**: 
  - Row 1: Category names (headers)
  - Rows 2+: Issue types under each category

#### Client Sheets
- **Format**: Multiple tabs named after clients (LPU, GNIOT, NISM, etc.)
- **Columns**:
  - A: Execution ID
  - B: User Number
  - C: Conversation Type
  - D: Duration (seconds)
  - E: Manual QC (notes)
  - F: Missed By AI (notes)
  - G-H or J-K: Category & Type (varies by sheet)
- **Features**:
  - Handles different column positions automatically
  - Supports missing/empty category/type values
  - Validates against master sheet

## API Endpoints

### Clients
- `GET /api/clients` - List all available clients
- `GET /api/metrics` - Get metrics for all clients
- `GET /api/clients/:clientName/metrics` - Get metrics for specific client
- `GET /api/clients/:clientName/category/:category` - Get all calls with a specific category

### Issue Management
- `POST /api/issue-status` - Update issue status (resolved/open)
  - Body: `{ executionId, client, category, type, status }`

## Database

The application uses SQLite to store issue status (resolved/open). The database is created automatically on first run at `qc_issues.db`.

### Issue Status Table
```sql
CREATE TABLE issue_status (
  id INTEGER PRIMARY KEY,
  execution_id TEXT,
  client TEXT,
  category TEXT,
  type TEXT,
  status TEXT DEFAULT 'open',
  created_at DATETIME,
  updated_at DATETIME
)
```

## Troubleshooting

### Backend won't start
- Check if port 5000 is available: `lsof -i :5000`
- Verify Google Sheets credentials are valid
- Check database file permissions

### Frontend won't load data
- Verify backend is running on http://localhost:5000
- Check browser console for CORS errors
- Ensure Google Sheets is accessible

### Data not loading for a client
- Verify the client sheet exists in the spreadsheet
- Check that the Category/Type columns exist
- Look for the column position in the code comments

## Security Note

⚠️ **IMPORTANT**: The Google Service Account credentials in `config.js` should be stored securely:

1. **Never commit this to public repositories**
2. **Consider moving credentials to environment variables:**
   ```bash
   # In .env file
   GOOGLE_PRIVATE_KEY=...
   GOOGLE_CLIENT_EMAIL=...
   ```

3. **Rotate credentials regularly** if they were exposed

## Future Enhancements

- [ ] Export reports as PDF/CSV
- [ ] Bulk status updates
- [ ] Team/user assignment
- [ ] Automated issue categorization using AI
- [ ] Trend analysis and reporting
- [ ] Call audio integration
- [ ] Team performance metrics
- [ ] Custom date range filtering
