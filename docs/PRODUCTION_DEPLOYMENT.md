# Production Deployment

Production-grade setup with permanent WhatsApp token, Claude LLM, always-on hosting, and monitoring.

## Stack

| Service | Purpose | Cost |
|---|---|---|
| Neon Pro | PostgreSQL | $9/mo |
| Anthropic | Claude LLM | ~$0.01-0.05/msg |
| Railway Pro | Backend (always-on) | $15-50/mo |
| Vercel | Frontend | Free–$20/mo |
| Meta WhatsApp Business | Messaging (permanent) | $0.05/msg |

**Estimated total**: $50–100+/mo depending on usage

## Step 1 — Permanent WhatsApp Token

Temporary tokens expire every ~16hrs. Get a permanent one via Meta System User.

1. Go to business.facebook.com → Settings → Users → **System Users**
2. Add → name: `zappyai-bot` → role: Admin
3. Click user → **Add Assets** → Apps → select your app → Full Control
4. Click **Generate New Token**:
   - App: your WhatsApp app
   - Expiry: **Never**
   - Permissions: `whatsapp_business_messaging`, `whatsapp_business_management`
5. Copy token — shown only once

## Step 2 — Anthropic Claude API

1. Sign up at console.anthropic.com → add payment method
2. API Keys → Create key → copy it
3. Set in Railway:
   ```env
   APP_MODE=production
   ANTHROPIC_API_KEY=<your_key>
   ANTHROPIC_MODEL=claude-opus-4-6
   ```

## Step 3 — Upgrade Infrastructure

### Railway (Always-On)
- Dashboard → Billing → upgrade to Pro ($15/mo)
- Removes sleep timeout, dedicated compute

### Neon (Pro Database)
- console.neon.tech → Billing → upgrade to Pro ($9/mo)
- Unlimited hours, 500GB storage, daily backups

## Step 4 — Custom Domain (Optional)

### Backend (Railway)
1. Settings → Networking → Custom Domain → add `api.yourdomain.com`
2. Add CNAME in DNS: `api.yourdomain.com → <railway-url>`

### Frontend (Vercel)
1. Project → Settings → Domains → add `yourdomain.com`
2. Add CNAME in DNS: `yourdomain.com → cname.vercel-dns.com`

SSL auto-provisioned on both.

## Step 5 — Production Environment Variables

Railway Variables:

```env
PORT=3000
DATABASE_URL=<neon_pro_url>
JWT_SECRET=<openssl rand -base64 32>
CORS_ORIGIN=https://yourdomain.com

APP_MODE=production
ANTHROPIC_API_KEY=<anthropic_key>
ANTHROPIC_MODEL=claude-opus-4-6

WHATSAPP_TOKEN=<permanent_system_user_token>
WHATSAPP_PHONE_ID=<phone_id>
WHATSAPP_VERIFY_TOKEN=<random_string>
WHATSAPP_API_URL=https://graph.facebook.com/v19.0

LOG_LEVEL=info
DISABLE_SCHEDULER=false
```

Vercel:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

## Step 6 — Security Checklist

- [ ] Strong `JWT_SECRET` (min 32 chars, random)
- [ ] CORS locked to your domain
- [ ] No secrets in git history
- [ ] 2FA enabled on Railway, Vercel, Neon, Meta accounts
- [ ] Neon daily backups enabled
- [ ] Uptime monitoring set up (Uptime Robot, Better Uptime)
- [ ] Error tracking configured (Sentry)
- [ ] WhatsApp token stored securely, not shared

## Step 7 — Monitoring

### Uptime Robot (Free)
1. uptimerobot.com → Add Monitor → HTTPS
2. URL: `https://api.yourdomain.com/health`
3. Check interval: 5 min
4. Alert email on down

### Sentry (Error Tracking)
```bash
npm install @sentry/node
```

Add to `backend/src/index.js`:
```js
import * as Sentry from '@sentry/node'
Sentry.init({ dsn: process.env.SENTRY_DSN, environment: 'production' })
```

Add `SENTRY_DSN` to Railway variables.

## Step 8 — Go Live Checklist

- [ ] Health check returns 200: `curl https://api.yourdomain.com/health`
- [ ] Frontend loads at custom domain
- [ ] WhatsApp sends and receives (permanent token)
- [ ] DB migrations ran successfully
- [ ] Uptime monitoring active
- [ ] Error tracking active
- [ ] Logs clean — no errors on startup
- [ ] Test full flow: register via WhatsApp → add task → check UI

## Maintenance

| Frequency | Task |
|---|---|
| Daily | Review error logs |
| Weekly | Check costs, API usage |
| Monthly | Rotate API keys, review DB size |
| As needed | Upgrade dependencies |
