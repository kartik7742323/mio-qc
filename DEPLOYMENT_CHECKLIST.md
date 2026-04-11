# Deployment Checklist ✅

## Before Running

- [ ] Google Sheets is shared with service account
- [ ] Internet connection available
- [ ] Ports 3000 and 5000 are available
- [ ] Node.js v14+ installed
- [ ] npm updated

## Dependencies Installed

- [ ] Root dependencies: `ls node_modules | wc -l` (should be >100)
- [ ] Client dependencies: `ls client/node_modules | wc -l` (should be >500)

## Files Present

- [ ] Backend files:
  - `server.js`
  - `config.js`
  - `services/sheetsService.js`
  - `services/databaseService.js`
  - `services/analyticsService.js`

- [ ] Frontend files:
  - `client/src/App.tsx`
  - `client/src/api.ts`
  - `client/src/components/Dashboard.tsx`
  - `client/src/components/CategoryDetail.tsx`

- [ ] Documentation:
  - `README.md`
  - `QUICKSTART.md`
  - `SETUP_SUMMARY.md`

## Starting the Application

1. [ ] Terminal 1: Run `npm run server`
   - Should see: "✅ Database initialized"
   - Should see: "🚀 QC Dashboard server running on http://localhost:5000"

2. [ ] Terminal 2: Run `npm run client` (from `client/` directory)
   - Should see React dev server starting
   - Should see: "Compiled successfully!"

3. [ ] Browser: Open `http://localhost:3000`
   - Should load without errors
   - Should see client dropdown populate

## Testing

- [ ] Select a client from dropdown
- [ ] Metrics load and display
- [ ] Click on a category
- [ ] See list of calls with that issue
- [ ] Try marking an issue as resolved
- [ ] Status updates without page reload
- [ ] Go back and see updated metrics

## Common Issues

| Issue | Solution |
|-------|----------|
| Port already in use | Kill other process: `lsof -i :5000` |
| npm modules not found | Run `npm run install-all` again |
| Google Sheets not accessible | Verify credentials in config.js |
| Database locked | Delete qc_issues.db and restart |
| CORS errors | Make sure backend is on :5000 |

## Production Readiness

- [ ] Move Google credentials to .env file
- [ ] Add error logging
- [ ] Set up database backups
- [ ] Configure HTTPS for production
- [ ] Add authentication if needed
- [ ] Test with all client data

---

## Quick Commands Reference

```bash
# One-time setup
npm run install-all

# Development (both server + client)
npm run dev

# Manual startup
npm run server          # Terminal 1
cd client && npm start  # Terminal 2

# Production build
cd client && npm run build
```

---

✨ **You're all set! Run `npm run dev` to start.**
