# ZappyAI

A WhatsApp-integrated AI personal assistant. Chat naturally on WhatsApp to manage tasks, contacts, notes, and reminders — all powered by LLM.

## Features

- **WhatsApp Integration** — receive and respond to messages via Meta Cloud API
- **AI Assistant** — understands natural language, manages your data via SQL tool calls
- **OTP Authentication** — login via WhatsApp OTP
- **Task Management** — create, track, and complete tasks
- **Contacts** — manage people with birthdays and priorities
- **Notes** — capture and search notes
- **Reminders** — set time-based reminders sent via WhatsApp
- **Multi-LLM** — Ollama (local), Groq (demo), Claude (production)
- **Web Dashboard** — view and manage everything from a browser

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js 22, Fastify 4 |
| Database | PostgreSQL (Sequelize ORM) |
| Auth | JWT + WhatsApp OTP |
| LLM | Ollama / Groq / Anthropic Claude |
| Frontend | Vue 3, Vite, Pinia |
| Scheduler | node-cron |

## Quick Start

```bash
# Backend
cd backend && npm install && cp .env.example .env
npm run migrate && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

See full guides:
- [Local Development](docs/LOCAL_SETUP.md)
- [Demo Deployment](docs/DEMO_DEPLOYMENT.md)
- [Production Deployment](docs/PRODUCTION_DEPLOYMENT.md)

## Project Structure

```
ZappyAI/
├── backend/
│   ├── src/
│   │   ├── ai/           # LLM runners, prompts, tools
│   │   ├── controllers/  # Request handlers
│   │   ├── db/           # Migrations, sequelize setup
│   │   ├── models/       # Sequelize models
│   │   ├── routes/       # API routes
│   │   ├── services/     # WhatsApp, scheduler
│   │   └── index.js      # Entry point
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── views/        # Dashboard, Tasks, Notes, Persons, Reminders
│   │   ├── components/   # AppLayout, shared UI
│   │   ├── stores/       # Pinia state
│   │   └── router/       # Vue Router
│   └── .env.example
└── docs/
    ├── LOCAL_SETUP.md
    ├── DEMO_DEPLOYMENT.md
    └── PRODUCTION_DEPLOYMENT.md
```

## APP_MODE

| Mode | LLM | Use Case |
|---|---|---|
| `development` | Ollama (local) | Local dev, no API costs |
| `demo` | Groq (free) | Cloud demo, free tier |
| `production` | Claude (Anthropic) | Full production |

## Health Check

```bash
curl http://localhost:3000/health
# {"status":"ok","db":"connected","timestamp":"..."}
```

## API Base

`/api/v1` — all endpoints require `Authorization: Bearer <token>`

Key endpoints:
- `POST /auth/request-otp` — send OTP via WhatsApp
- `POST /auth/verify-otp` — verify OTP, get JWT
- `GET/POST /tasks` — tasks
- `GET/POST /notes` — notes
- `GET/POST /persons` — contacts
- `GET/DELETE /reminders` — reminders
- `GET /webhooks/whatsapp` — webhook verify
- `POST /webhooks/whatsapp` — incoming messages
- `GET /health` — health check
