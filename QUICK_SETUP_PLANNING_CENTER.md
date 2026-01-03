# Quick Setup: Planning Center OAuth

## The Error You're Seeing

"Planning Center login failed" - This happens because the OAuth credentials are not configured.

## Quick Fix (2 Steps)

### Step 1: Get OAuth Credentials from Planning Center

1. Go to: https://api.planningcenteronline.com/oauth/applications
2. Click "New Application" or use an existing one
3. Set the **Redirect URI** to: `http://localhost:5173/auth/callback`
4. Copy your **Client ID** and **Client Secret**

### Step 2: Add to Backend .env File

Open `backend/.env` and add these lines:

```env
PLANNING_CENTER_CLIENT_ID=your_client_id_here
PLANNING_CENTER_CLIENT_SECRET=your_client_secret_here
PLANNING_CENTER_REDIRECT_URI=http://localhost:5173/auth/callback
```

### Step 3: Restart Backend Server

The backend needs to be restarted to pick up the new environment variables.

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd backend
npm run dev
```

## Verify It's Working

1. Go to http://localhost:5173/login
2. Click "Sign in with Planning Center"
3. You should be redirected to Planning Center's login page
4. After logging in, you'll be redirected back and logged in

## Common Issues

### "Planning Center OAuth not configured"
- Make sure you added the 3 environment variables to `backend/.env`
- Make sure you restarted the backend server after adding them
- Check for typos in the variable names

### "Redirect URI mismatch"
- The redirect URI in `.env` must EXACTLY match what's in Planning Center
- No trailing slashes
- Must include `http://` or `https://`
- For localhost: `http://localhost:5173/auth/callback`

### "Invalid client"
- Double-check your Client ID and Client Secret
- Make sure there are no extra spaces or quotes
- The credentials are case-sensitive

## Production Setup

When deploying to production:

1. Update `PLANNING_CENTER_REDIRECT_URI` to your production URL:
   ```env
   PLANNING_CENTER_REDIRECT_URI=https://yourdomain.com/auth/callback
   ```

2. Update the redirect URI in Planning Center Developer Portal to match

3. Restart your production server

## Need Help?

Check the browser console and backend logs for detailed error messages. The improved error handling will now show you exactly what's missing.
