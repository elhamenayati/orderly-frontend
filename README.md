# Mahoura MVP frontend

Persian RTL app for salon management, customer booking, and platform admin.
This folder is the Next.js app.

## Run

Copy `.env/example` to `.env/local`, then run `npm install` and `npm run dev`.

Windows: `copy .env\example .env\local`

macOS/Linux: `cp .env/example .env/local`

Customer prototype: http://localhost:3000

Salon and admin URLs exist (`/salon/*`, `/admin/*`) with theme tokens only. Product screens are not built yet.

## Environment

Values live in `.env/`, not hardcoded in source.

- `.env/example` is committed
- `.env/local` is gitignored

`next.config.ts` loads `.env/local`, then falls back to `.env/example`. Process environment wins. Client code reads `NEXT_PUBLIC_*` keys through `config/env.ts`.

Never commit `.env/local`.

## Folders

- `public/images/` — customer, salon, admin, brand
- `mock_ts/` — TypeScript demo records
- `types/` — domain and BookingService draft types

Reference images as `/images/...`. Do not serve `docs/ui/`. Import lists from `mock_ts`.

## Themes

Customer `/` dusty rose `#C97C84`. Salon `/salon` purple `#5C33A1`. Admin `/admin` dark blue `#1B365D`.

Root layout is Persian RTL with Vazirmatn.

Product docs: `../docs/ARCHITECTURE.md` and `../docs/MVP_FRONTEND_PLAN.md`.
