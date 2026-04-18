# Local Development Setup

## Prerequisites

- Node.js v22+
- PostgreSQL 14+ (local or Docker)
- Ollama (for local LLM)
- Git

### macOS

```bash
brew install node@22 postgresql ollama
```

### Ubuntu/Debian

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs postgresql
curl -fsSL https://ollama.ai/install.sh | sh
```

## Step 1 — Clone

```bash
git clone https://github.com/naveenkumar-chandrasekar/ZappyAI.git
cd ZappyAI
```

## Step 2 — PostgreSQL

### Option A: Local

```bash
psql postgres -c "CREATE USER zappy WITH PASSWORD 'zappy';"
psql postgres -c "CREATE DATABASE zappy OWNER zappy;"
```

### Option B: Docker

```bash
docker run --name zappy-postgres \
  -e POSTGRES_USER=zappy \
  -e POSTGRES_PASSWORD=zappy \
  -e POSTGRES_DB=zappy \
  -p 5432:5432 -d postgres:16-alpine
```

## Step 3 — Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```env
PORT=3011
DATABASE_URL=postgresql://zappy:zappy@localhost:5432/zappy
JWT_SECRET=local-dev-secret-change-in-prod
APP_MODE=development
OLLAMA_BASE_URL=http://localhost:11434
LLM_PROVIDER=ollama
LLM_MODEL=qwen2.5:7b
WHATSAPP_TOKEN=dummy
WHATSAPP_PHONE_ID=dummy
WHATSAPP_VERIFY_TOKEN=dummy
WHATSAPP_API_URL=https://graph.facebook.com/v19.0
DISABLE_SCHEDULER=false
```

Run migrations:

```bash
npm run migrate
```

Start dev server:

```bash
npm run dev
```

Test:

```bash
curl http://localhost:3011/health
```

## Step 4 — Ollama

```bash
ollama serve          # start Ollama service
ollama pull qwen2.5:7b  # pull the model used in .env
```

## Step 5 — Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3011
```

Start:

```bash
npm run dev
```

Open http://localhost:5173

## Step 6 — WhatsApp Local Testing (Optional)

Use [ngrok](https://ngrok.com) to expose localhost:

```bash
ngrok http 3011
```

Set webhook URL in Meta dashboard:
```
https://<ngrok-id>.ngrok.io/api/v1/webhooks/whatsapp
```

Set real credentials in `.env`:
```env
WHATSAPP_TOKEN=<meta_token>
WHATSAPP_PHONE_ID=<phone_id>
WHATSAPP_VERIFY_TOKEN=<your_verify_token>
```

## Useful Commands

```bash
# Backend
npm run dev           # dev server (hot reload)
npm run migrate       # run migrations
npm test              # run tests
npm start             # production mode

# Frontend
npm run dev           # dev server
npm run build         # production build
npm run preview       # preview build
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `ECONNREFUSED 5432` | PostgreSQL not running |
| `EADDRINUSE 3011` | Port in use — `lsof -ti:3011 \| xargs kill -9` |
| Ollama connection failed | Run `ollama serve` |
| Frontend can't reach API | Check `VITE_API_BASE_URL` in `frontend/.env` |
