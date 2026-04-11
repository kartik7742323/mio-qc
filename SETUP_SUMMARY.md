# QC Dashboard - Setup Summary

✅ **Your QC Issues Dashboard is fully built and ready to use!**

## What Has Been Built

### Architecture
- **Backend**: Node.js + Express API server (port 5000)
- **Frontend**: React + TypeScript dashboard (port 3000)
- **Database**: SQLite for storing issue status (resolved/open)
- **Data Source**: Google Sheets API integration

### Key Features Implemented

#### 1. **Dashboard Overview**
   - Client selector dropdown
   - Real-time metrics:
     - Total calls analyzed
     - Calls with issues vs clean calls
     - Open vs resolved issues
     - Issues by category breakdown
   - Visual metric cards with instant status indicators

#### 2. **Category-Based Drill-Down**
   - Click any category card to see all calls with that issue
   - View all issues found in each call with:
     - Execution ID and call metadata
     - Manual QC notes and notes on what AI missed
     - Individual issue status indicators

#### 3. **Issue Status Management**
   - Toggle issues between "Open" and "Resolved"
   - Status changes saved instantly to database
   - Visual indicators for open (red) vs resolved (green) issues
   - Bulk view across all issues in a category

#### 4. **Smart Data Handling**
   - Automatically detects Category/Type columns in different positions (G,H or J,K)
   - Handles typos like "Catagory"
   - Validates data against master sheet (Sheet2)
   - Supports empty/missing category/type values

#### 5. **Multi-Client Support**
   - Switch between clients instantly
   - Each client's metrics and issues tracked separately
   - Supports clients: LPU, GNIOT, NISM, Vel Tech, Lexicon Mile, Jaipuria, Woxsen, Pimpri, ITM, Adamas, etc.

---

## Project Structure

```
qc-dashboard/
├── Backend Services
│   ├── server.js                    # Express API server
│   ├── config.js                    # Configuration & credentials
│   └── services/
│       ├── sheetsService.js         # Google Sheets integration
│       ├── databaseService.js       # SQLite database manager
│       └── analyticsService.js      # Data processing & metrics
│
├── React Frontend
│   ├── client/src/
│   │   ├── App.tsx                  # Main application
│   │   ├── api.ts                   # API client library
│   │   ├── components/
│   │   │   ├── Dashboard.tsx        # Metrics overview page
│   │   │   ├── Dashboard.css
│   │   │   ├── CategoryDetail.tsx   # Issue drill-down page
│   │   │   └── CategoryDetail.css
│   │   └── App.css                  # Global styles
│   └── package.json
│
├── Configuration
│   ├── package.json                 # Root scripts & dependencies
│   ├── .gitignore                   # Git ignore rules
│   ├── README.md                    # Full documentation
│   ├── QUICKSTART.md                # Quick start guide
│   └── SETUP_SUMMARY.md             # This file
```

---

## Getting Started

### 1. First-Time Setup

Run this once to install all dependencies:

```bash
npm run install-all
```

### 2. Start the Application

**Simple way (run everything together):**
```bash
npm run dev
```

**Or manually (if you want separate terminals):**

Terminal 1:
```bash
npm run server
```

Terminal 2:
```bash
npm run client
```

### 3. Access the Dashboard

Open in your browser:
```
http://localhost:3000
```

---

## Using the Dashboard

### Step 1: Select a Client
- Use the dropdown at the top to choose a client
- Dashboard loads instantly with their data

### Step 2: Review Metrics
View 6 key metrics:
- 📞 **Total Calls Analyzed** - How many calls were QC'd
- ⚠️ **Calls with Issues** - How many had problems
- ✅ **Clean Calls** - Problem-free calls
- 🔴 **Total Issues** - Total issues found
- 📂 **Open Issues** - Still unresolved
- 🎯 **Resolved Issues** - Fixed issues with %

### Step 3: Explore by Category
- See all issue categories as cards
- Each card shows:
  - Category name and total count
  - Open vs Resolved breakdown
  - Visual progress bar
  - Sort by most common issues automatically

### Step 4: Drill Into Calls
- Click any category to see all calls with that issue
- For each call, see:
  - Execution ID and user number
  - Call duration and metadata
  - Full QC notes from your team
  - Notes on what AI missed
  - All issues in that specific call

### Step 5: Mark Issues as Resolved
- For each issue, click "Mark Resolved"
- Or click "Mark Open" to reopen resolved issues
- Changes save instantly
- Status persists in local database

---

## API Endpoints

If you want to integrate with other tools, these endpoints are available:

### Get Data
```
GET  /api/clients                              # List all clients
GET  /api/metrics                              # Metrics for all clients
GET  /api/clients/:clientName/metrics          # Metrics for one client
GET  /api/clients/:clientName/category/:category # Issues in a category
```

### Update Status
```
POST /api/issue-status
Body: {
  executionId: "string",
  client: "string",
  category: "string", 
  type: "string",
  status: "open" | "resolved"
}
```

---

## Data Structure

### Master Sheet (Sheet2)
- **Column headers**: Category names (User_Behaviour, Technical_Network, STT_Issue, etc.)
- **Column values**: Specific issue types under each category
- **Purpose**: Define valid categories and issue types

### Client Sheets (LPU, GNIOT, etc.)
- **Column A**: Execution ID
- **Column B**: User Number (phone)
- **Column C**: Conversation Type (plivo outbound, etc.)
- **Column D**: Duration in seconds
- **Column E**: Manual QC (text notes)
- **Column F**: Missed By AI (text notes)
- **Column G/J**: Category
- **Column H/K**: Type
- **Note**: Category/Type position varies; system detects automatically

---

## Database

A SQLite database (`qc_issues.db`) stores issue statuses:

```sql
-- Automatically created on first run
CREATE TABLE issue_status (
  id INTEGER PRIMARY KEY,
  execution_id TEXT NOT NULL,
  client TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at DATETIME,
  updated_at DATETIME,
  UNIQUE(execution_id, category, type)
)
```

---

## Troubleshooting

### Backend Not Starting
```bash
# Check if port 5000 is in use
lsof -i :5000

# If in use, either:
# 1. Kill the process
# 2. Change the port in server.js (line ~10)

# If database corrupted, delete and rebuild:
rm qc_issues.db
```

### Frontend Can't Connect
```bash
# Make sure backend is running first
curl http://localhost:5000/api/health

# Check for CORS errors in browser console (F12)
# Should show: { success: true, message: "Server is running" }
```

### No Data Appears
1. Check if client name in dropdown matches exactly (case-sensitive)
2. Verify the Google Sheets is accessible
3. Open browser DevTools (F12) → Console tab
4. Check for any error messages
5. Try refreshing the page (Ctrl+R)

### Slow Performance
- Dashboard caches metrics in React state
- If slow, check internet connection to Google Sheets
- First load takes 2-3 seconds while fetching all data

---

## Next Steps

### Immediate
1. Run `npm run dev` to start
2. Test with one client
3. Click through categories to verify data looks correct
4. Try marking an issue as resolved

### Short Term
- Explore all clients' data
- Validate that categories match your expectations
- Get team to test and provide feedback

### Future Enhancements
Consider adding:
- PDF/CSV export reports
- Trend analysis over time
- Team performance metrics
- Bulk status updates
- Automated categorization using AI
- Call audio playback integration
- Custom date range filtering

---

## Important Security Notes

⚠️ **The Google Service Account credentials are embedded in config.js**

### What You Should Do:
1. **Never commit** to public repositories
2. **Move to environment variables** (recommended):
   ```bash
   # Create .env file
   GOOGLE_PRIVATE_KEY=<paste private key>
   GOOGLE_CLIENT_EMAIL=<paste email>
   ```

3. **Rotate credentials regularly** if exposed
4. **Keep repo private** or use separate credentials

---

## Files Reference

| File | Purpose |
|------|---------|
| `server.js` | Main Express server - handles all APIs |
| `config.js` | Google Sheets credentials & settings |
| `services/sheetsService.js` | Fetches data from Google Sheets |
| `services/databaseService.js` | SQLite status database |
| `services/analyticsService.js` | Metrics & data processing |
| `client/src/App.tsx` | Main React component |
| `client/src/api.ts` | Frontend API client |
| `client/src/components/Dashboard.tsx` | Metrics overview UI |
| `client/src/components/CategoryDetail.tsx` | Issue drill-down UI |

---

## Questions?

Refer to:
- **QUICKSTART.md** - For fast setup
- **README.md** - For detailed documentation
- **Browser Console** (F12) - For debug messages
- **Network Tab** (F12) - To inspect API calls

---

**Happy QC tracking! 🚀**
