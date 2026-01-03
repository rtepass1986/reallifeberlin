# Planning Center Authentication Setup

This application supports authentication using Planning Center OAuth (OpenID Connect), allowing users to sign in with their existing Planning Center email and password.

## Setup Instructions

### 1. Register Your Application in Planning Center

1. Go to the [Planning Center Developer Portal](https://api.planningcenteronline.com/oauth/applications)
2. Create a new OAuth application
3. Set the **Redirect URI** to: `http://localhost:5173/auth/callback` (for development)
   - For production, use your production URL: `https://yourdomain.com/auth/callback`
4. Note your **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Add these to your `backend/.env` file:

```env
# Planning Center OAuth
PLANNING_CENTER_CLIENT_ID=your_client_id_here
PLANNING_CENTER_CLIENT_SECRET=your_client_secret_here
PLANNING_CENTER_REDIRECT_URI=http://localhost:5173/auth/callback

# Existing Planning Center API (if you have it)
PLANNING_CENTER_API_KEY=your_api_key_here
PLANNING_CENTER_APP_ID=your_app_id_here
PLANNING_CENTER_BASE_URL=https://api.planningcenteronline.com
```

### 3. How It Works

1. **User clicks "Sign in with Planning Center"** on the login page
2. **User is redirected** to Planning Center's OAuth login page
3. **User enters their Planning Center credentials** (email and password)
4. **Planning Center redirects back** to your app with an authorization code
5. **Your backend exchanges the code** for an access token
6. **User info is retrieved** from Planning Center
7. **User is created/updated** in your database automatically
8. **User is logged in** to your application

### 4. User Management

- Users are automatically created in your database when they first log in via Planning Center
- User information (name, email) is synced from Planning Center on each login
- Users can still use regular email/password login if they have a local account
- If a user exists in Planning Center but not in your app, they'll be prompted to use Planning Center login

### 5. Fallback Behavior

If Planning Center OAuth is not configured:
- Users can still use regular email/password authentication
- The "Sign in with Planning Center" button will show an error
- You can configure it later without breaking existing functionality

## API Endpoints

### Get Authorization URL
```
GET /api/auth/planning-center/authorize
```

Returns the Planning Center OAuth authorization URL.

### OAuth Callback
```
POST /api/auth/planning-center/callback
Body: { code: "authorization_code" }
```

Exchanges the authorization code for tokens and creates/logs in the user.

## Security Notes

- OAuth tokens are handled securely by Planning Center
- User passwords are never stored or transmitted to your application
- All OAuth communication uses HTTPS
- Access tokens are only used server-side
- Users must have a Planning Center account to use this login method

## Troubleshooting

### "Planning Center login failed"
- Check that `PLANNING_CENTER_CLIENT_ID` and `PLANNING_CENTER_CLIENT_SECRET` are set correctly
- Verify the redirect URI matches exactly what's configured in Planning Center
- Check backend logs for detailed error messages

### "User not found in Planning Center"
- The email must exist in Planning Center
- User must have access to your Planning Center organization
- Check Planning Center API permissions

### Redirect URI Mismatch
- The redirect URI in `.env` must exactly match the one in Planning Center
- Include the full URL including `http://` or `https://`
- No trailing slashes

## Production Setup

For production:

1. Update `PLANNING_CENTER_REDIRECT_URI` to your production URL
2. Update the redirect URI in Planning Center Developer Portal
3. Ensure your production domain is verified in Planning Center
4. Use HTTPS for all OAuth redirects
