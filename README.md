# VibeDJ AI

Plataforma SaaS de DJ inteligente para IMVU.

## Objetivos

- Autenticación con Discord OAuth
- Gestión de licencias temporales y permanentes
- Asociación de cuenta IMVU y salas
- Instalación y control de un DJ virtual por comandos
- Generación de playlists inteligentes con IA
- Panel SaaS para usuarios y administración Founder

## Arquitectura

- Frontend: Next.js 15+, React, TypeScript, TailwindCSS, Shadcn UI
- Backend: NestJS, TypeScript, Prisma
- Base de datos: PostgreSQL
- Cache: Redis
- OAuth: Discord
- Pagos: PayPal
- Contenedores: Docker + Docker Compose

## Estructura inicial

- `backend/` - API NestJS, Prisma, módulos de dominio
- `frontend/` - UI Next.js, dashboard SaaS
- `docker-compose.yml` - servicios locales: backend, frontend, postgres, redis
- `prisma/schema.prisma` - modelo de datos central

## Comandos

### Backend

```bash
cd backend
npm install
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API inicial

- `POST /auth/discord/login`
- `GET /auth/discord/callback`
- `GET /auth/me`
- `GET /users/me`
- `GET /imvu/me`
- `POST /imvu/link`
- `GET /rooms`
- `POST /rooms`
- `GET /licenses`
- `POST /licenses`
- `POST /bot/install`
- `POST /bot/command`
- `POST /payments/paypal/create`
- `POST /payments/paypal/capture`
- `POST /music/fillplaylist`
- `POST /music/autodj`
- `POST /music/record`

### Docker

```bash
docker compose up --build
```
