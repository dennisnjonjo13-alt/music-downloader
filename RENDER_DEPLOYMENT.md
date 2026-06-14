# Render Deployment Guide

## Quick Start (2 minutes)

### 1. Connect GitHub
1. Go to [render.com](https://render.com)
2. Click **+ New** → **Web Service**
3. Connect your GitHub account
4. Select `dennisnjonjo13-alt/music-downloader`
5. Fill in the service name: `music-downloader`

### 2. Configure Environment
Set these environment variables in Render dashboard:

**Required:**
- `GEMINI_API_KEY` - Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
- `NODE_ENV` - Set to `production`

**Optional (auto-set):**
- `APP_URL` - Will be auto-generated with your Render URL

### 3. Deploy Settings
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Node Version:** 18.x (default)

### 4. Deploy
Click **Create Web Service** and wait for deployment (2-3 minutes).

---

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key | `AIzaSy...` |
| `APP_URL` | ✅ Yes | Your Render URL | `https://music-downloader.onrender.com` |
| `NODE_ENV` | ✅ Yes | Set to production | `production` |

### Get GEMINI_API_KEY
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with Google account
3. Click **Create API key**
4. Copy the key
5. Paste into Render environment variables

---

## Port Configuration
- **Local Dev:** Port 3000 (in server.ts)
- **Render:** Automatically uses available port (ignored if specified)

The app listens on `0.0.0.0:3000` but Render overrides this. The build handles both:
- **Dev mode:** Vite dev server + Express middleware
- **Prod mode:** Built React files + Express static server

---

## Troubleshooting

### Build Fails
```
Error: Cannot find module '@google/genai'
```
✅ **Solution:** Already included in package.json. Render will auto-install.

### App Won't Start
```
Error: ENOENT: no such file or directory, open 'dist/index.html'
```
✅ **Solution:** Build happens automatically. Check logs in Render dashboard.

### Gemini API Not Working
```
Error: Invalid API key
```
✅ **Solution:** 
1. Verify key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Update in Render Environment section
3. Redeploy service

### Port Issues
✅ **Solution:** Express already binds to `0.0.0.0` which Render supports. No changes needed.

---

## File Structure
```
.
├── server.ts              # Express backend
├── package.json           # Dependencies
├── vite.config.ts         # Vite build config
├── index.html             # React entry
├── tsconfig.json          # TypeScript config
├── render.yaml            # Render config (this deployment)
├── Procfile               # Process type
├── .npmrc                 # npm config
└── dist/                  # Built files (created during build)
```

---

## After Deployment

1. Visit your Render URL: `https://your-service.onrender.com`
2. Test API endpoints:
   - Search: `GET /api/search?q=music`
   - Download: `POST /api/download` with `videoId`

3. Check logs:
   - Render Dashboard → Logs tab
   - Look for: `[Server] SoundWave fully running`

---

## Free Tier Limitations
- Spins down after 15 minutes of inactivity (restart takes ~30s)
- No custom domain
- Shared infrastructure

**Upgrade to Pro** if you need:
- Always-on service
- Custom domain
- Priority support

---

## Need Help?
- [Render Docs](https://render.com/docs)
- [Express + Node on Render](https://render.com/docs/deploy-node-express-app)
- GitHub Issues in this repo
