# GreenBean

Monorepo structure:

- `frontend/` - Vite React app
- `backend/` - Express + Prisma API

## Local Development

Frontend:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Backend:

```powershell
cd backend
npm.cmd install
npm.cmd run dev
```

## Railway

Create separate Railway services from the same repo:

- Frontend service root directory: `frontend`
- Backend service root directory: `backend`
- Database service: PostgreSQL

Each app folder has its own `railway.toml`.
