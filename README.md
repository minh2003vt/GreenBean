# GreenBean Backend

Node.js + Express + Prisma backend based on the provided database diagram.
The backend uses PostgreSQL.

## Setup

```bash
cd backend
npm install
copy .env.example .env
npm run prisma:migrate
npm run seed
npm run dev
```

On Windows PowerShell, use `npm.cmd` if `npm` is blocked by execution policy:

```powershell
npm.cmd run prisma:migrate
npm.cmd run seed
npm.cmd run dev
```

API runs at `http://localhost:4000` by default.

## Main Routes

- `GET /health`
- `GET /docs`
- `GET /openapi.json`
- `POST /api/users/register`
- `POST /api/users/login`
- `POST /api/users/logout`
- `GET/PATCH /api/users/me`
- `POST /api/users/forgot-password`
- `POST /api/users/reset-password`
- `PATCH /api/users/password`
- `GET /api/problems`
- `GET /api/problems/:slug`
- `POST/PATCH/DELETE /api/problems` admin only
- `GET /api/products`
- `POST /api/products`
- `PATCH /api/products/:id/approval`
- `GET/POST/PATCH/DELETE /api/cart`
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/challenges`
- `POST/PATCH/DELETE /api/challenges` admin only
- `GET /api/challenges/:id/participants` admin only
- `POST /api/user-challenges`
- `PATCH /api/user-challenges/:id`
- `POST /api/uploads`

Seed users use password `GreenBean@123`.
