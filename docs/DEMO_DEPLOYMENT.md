# Demo Deployment

Free cloud deployment using Neon + Groq + Railway + Vercel + Meta WhatsApp sandbox.

## Stack

| Service | Purpose | Cost |
|---|---|---|
| [Neon](https://neon.tech) | PostgreSQL | Free |
| [Groq](https://console.groq.com) | LLM (llama-3.3-70b) | Free |
| [Railway](https://railway.app) | Backend hosting | Free / $5/mo |
| [Vercel](https://vercel.com) | Frontend hosting | Free |
| Meta WhatsApp | Messaging | Free sandbox |

## Step 1 — Neon (Database)

1. Sign up at neon.tech → create project
2. Copy connection string: `postgresql://user:pass@host/dbname`
3. Run migrations locally against Neon:
   ```bash
   DATABASE_URL=<neon_url> npm run migrate
   ```

## Step 2 — Groq (LLM)

1. Sign up at console.groq.com
2. API Keys → Create API Key → copy it

## Step 3 — Push to GitHub

```bash
cd ZappyAI
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/<username>/ZappyAI.git
git push -u origin master
```

## Step 4 — Railway (Backend)

1. Sign up at railway.app → New Project → Deploy from GitHub → select `ZappyAI`
2. Settings:
   - Root directory: `backend`
   - Builder: `Nixpacks`
   - Start command: `npm run migrate && npm start`
   - Port: `8080` (Railway assigns this)
3. Variables tab — add all:

```env
DATABASE_URL=<neon_url>
APP_MODE=demo
GROQ_API_KEY=<groq_key>
GROQ_MODEL=llama-3.3-70b-versatile
JWT_SECRET=<strong_random_string>
PORT=3000
WHATSAPP_TOKEN=<meta_temp_token>
WHATSAPP_PHONE_ID=<meta_phone_id>
WHATSAPP_VERIFY_TOKEN=<your_verify_token>
WHATSAPP_API_URL=https://graph.facebook.com/v19.0
```

4. Settings → Networking → Generate Domain → note URL
5. Settings → Networking → change port to `8080`

Test:
```bash
curl https://<railway-url>/health
```

## Step 5 — Vercel (Frontend)

1. Sign up at vercel.com → Add New Project → import `ZappyAI`
2. Root directory: `frontend`
3. Environment variable: `VITE_API_BASE_URL=https://<railway-url>`
4. Deploy → note Vercel URL

## Step 6 — WhatsApp Webhook

### Get Meta Credentials

1. developers.facebook.com → Your App → WhatsApp → API Setup
2. Copy **Temporary access token** (expires ~16hrs)
3. Copy **Phone number ID**
4. Add a test recipient (your personal WhatsApp number)

### Configure Webhook

1. WhatsApp → Configuration → Webhook → Edit
2. Callback URL: `https://<railway-url>/api/v1/webhooks/whatsapp`
3. Verify token: must match `WHATSAPP_VERIFY_TOKEN` in Railway
4. Click Verify and Save
5. Subscribe to **messages** field

### Test

Send a WhatsApp message to the Meta test number. The bot should reply.

## Limitations

| Issue | Workaround |
|---|---|
| WhatsApp token expires every ~16hrs | Regenerate in Meta dashboard |
| Railway free tier sleeps after 15min | Upgrade to $5/mo plan |
| Groq rate limit: 30 req/min | Sufficient for demo |

## Monitoring

- Railway → Logs tab for backend errors
- Neon → SQL Editor to inspect DB
- Meta dashboard for WhatsApp delivery status
