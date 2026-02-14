# Birzha Kanaliv (Youtoobe)

Marketplace for YouTube channel exchange and collaboration.

## Stack
- `client`: React + Vite user frontend (`http://localhost:5173`)
- `admin-frontend`: React + Vite admin frontend (`http://localhost:5174`)
- `server`: Node.js + Express + Sequelize API (`http://localhost:3001`)
- PostgreSQL for persistent data

## Requirements
- Node.js 18+
- PostgreSQL 14+
- npm

## Quick Start
1. Create database:
```sql
CREATE DATABASE youtoobe;
```
2. Copy environment files:
```bash
cp server/.env.example server/.env
cp admin-frontend/.env.example admin-frontend/.env
```
3. Install dependencies:
```bash
npm run install:all
```
4. Apply migrations and seeds:
```bash
npm run setup
```
5. Start all apps:
```bash
npm run dev:full
```

## Scripts
- `npm run dev` - run server + user frontend
- `npm run dev:full` - run server + user frontend + admin frontend
- `npm run test` - run server and client tests
- `npm run build` - build user frontend
- `npm run build:admin` - build admin frontend
- `npm run migrate` - apply DB migrations
- `npm run seed` - apply DB seeds

## Startup Scripts
- `start.bat` (Windows) and `start.sh` (Linux/Mac) do:
1. DB connectivity check
2. migrations
3. seeds
4. start backend + user frontend + admin frontend

## Project Structure
```text
youtoobe/
  client/
  admin-frontend/
  server/
  docs/
  start.bat
  start.sh
```

## Notes
- Default first admin is seeded with email: `vladkatintam@gmail.com`.
- Do not commit real secrets to `.env` files.
