# Deployment

[![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?logo=vercel&logoColor=white)](https://vercel.com/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.17-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

## Overview

The dashboard is designed for deployment on **Vercel** (recommended) or any platform that supports Next.js 16. It uses server-side rendering and API routes, so static-only hosting won't work.

## Vercel Deployment (Recommended)

### 1. Connect Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Vercel auto-detects Next.js — no build configuration needed

### 2. Set Environment Variables

In the Vercel project dashboard, go to **Settings → Environment Variables** and add all 8 required variables:

| Variable | Value |
|----------|-------|
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` |
| `NEXTAUTH_SECRET` | Result of `openssl rand -base64 32` |
| `GOOGLE_OAUTH_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_OAUTH_CLIENT_SECRET` | From Google Cloud Console |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email |
| `GOOGLE_PRIVATE_KEY` | Full PEM key (including `-----BEGIN/END-----`) |
| `GOOGLE_SHEET_ID` | From the Google Sheet URL |

> **Tip:** For `GOOGLE_PRIVATE_KEY`, paste the entire PEM key including newlines. Vercel handles multi-line environment variables correctly.

### 3. Update OAuth Redirect URI

In Google Cloud Console → **APIs & Services → Credentials → OAuth 2.0 Client**, add:

```
https://your-domain.vercel.app/api/auth/callback/google
```

### 4. Deploy

Push to your main branch — Vercel deploys automatically.

---

## Self-Hosted Deployment

### Prerequisites

- Node.js >= 18.17
- npm >= 9

### Build & Run

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm run start
```

The server runs on port 3000 by default. Set `PORT` environment variable to change it.

### Process Manager (PM2)

For production, use a process manager:

```bash
npm install -g pm2

# Start with PM2
pm2 start npm --name "placement-dashboard" -- start

# Auto-restart on crash
pm2 startup
pm2 save
```

### Reverse Proxy (Nginx)

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

> **Note:** To use standalone output, add `output: "standalone"` to `next.config.ts`.

### Docker Compose

```yaml
version: "3.8"
services:
  dashboard:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    restart: unless-stopped
```

---

## Production Checklist

Before going live, verify each item:

### Environment & Configuration

- [ ] All 8 environment variables are set
- [ ] `NEXTAUTH_URL` matches the production domain (with `https://`)
- [ ] `NEXTAUTH_SECRET` is a unique, random 32+ character string
- [ ] Google OAuth redirect URI includes the production domain
- [ ] Google Sheet is shared with the service account as Viewer

### Security

- [ ] HTTPS is enabled (Let's Encrypt or cloud provider)
- [ ] `NEXTAUTH_URL` uses `https://` (not `http://`)
- [ ] No secrets are committed to the repository
- [ ] `.env.local` is in `.gitignore`

### Data

- [ ] Access sheet has at least one `admin` email
- [ ] Master and Offer_Details sheets have correct column order
- [ ] Tab names are exactly `Master`, `Offer_Details`, `Access`

### Testing

- [ ] `npm run build` completes without errors
- [ ] Login flow works with a test Google account
- [ ] Dashboard loads with real data
- [ ] Admin-only pages (Students, Export) are gated
- [ ] Viewer sees anonymized data (no names/roll numbers)
- [ ] PDF export generates correctly
- [ ] CSV export downloads successfully

---

## Monitoring

### Cache Behavior

The in-memory cache has a 5-minute TTL. On a fresh deployment (cold start):

1. First request fetches from Google Sheets (~2-3 seconds)
2. Subsequent requests use cache (~50ms)
3. After 5 minutes, next request refreshes the cache
4. On Sheets API error, stale cache is served

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "Unable to verify access" on login | Access sheet not readable | Check service account has Viewer access |
| "Authentication failed" | OAuth redirect URI mismatch | Add production URL to OAuth client |
| Stale data after sheet update | 5-minute cache | Wait for cache expiry or trigger refresh in UI |
| 500 on `/api/data` | Invalid `GOOGLE_PRIVATE_KEY` | Ensure PEM key has proper line breaks |
| Missing environment variable | Variable not set in Vercel | Check Vercel project settings |
