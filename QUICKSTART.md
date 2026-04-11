# Quick Start Guide

Get the QC Dashboard up and running in 2 minutes!

## Step 1: Install Dependencies (First Time Only)

```bash
npm run install-all
```

This installs both backend and frontend dependencies.

## Step 2: Start the Application

**Option A - Run Everything at Once:**
```bash
npm run dev
```

**Option B - Manual Setup:**

Terminal 1:
```bash
npm run server
```

Terminal 2 (in another terminal):
```bash
npm run client
```

## Step 3: Access the Dashboard

Open your browser and go to:
```
http://localhost:3000
```

You should see the QC Dashboard loading!

## What's Next?

1. **Select a Client**: Choose a client from the dropdown
2. **Review Metrics**: See the overview of QC data for that client
3. **Drill Down**: Click on any category to see specific issues
4. **Manage Status**: Mark issues as resolved/open as needed

## Troubleshooting

**Backend won't start?**
- Check if port 5000 is available
- Delete `qc_issues.db` and try again

**Frontend won't connect?**
- Make sure backend is running first
- Check `http://localhost:5000/api/health` - should return success

**No data showing?**
- Check browser console for errors (F12)
- Verify the client names match exactly (case-sensitive)
- Check that Google Sheets is accessible

## Need Help?

See the full README.md for detailed documentation and API reference.
