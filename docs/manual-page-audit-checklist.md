# Manual Page Audit Checklist

Date: 2026-02-13

## Scope
- User frontend: `http://localhost:5173`
- Admin frontend: `http://localhost:5174`
- API backend: `http://localhost:3001/api`

## Global checks for every page
- Page opens without console errors.
- Text encoding is readable (no mojibake).
- Contrast is readable on default browser zoom 100%.
- Header/menu does not overflow on 1366x768 and 1920x1080.
- Mobile layout works at 390x844.
- Back/forward navigation keeps state correctly.
- Unauthorized user is redirected to auth for protected pages.

## User frontend routes
- [ ] `/`
- [ ] `/offers`
- [ ] `/offers/:offerId`
- [ ] `/blog`
- [ ] `/blog/:slug`
- [ ] `/faq`
- [ ] `/auth`
- [ ] `/dashboard`
- [ ] `/my-channels`
- [ ] `/my-channels/:id`
- [ ] `/dashboard/offers`
- [ ] `/swaps/incoming`
- [ ] `/swaps/outgoing`
- [ ] `/exchanges`
- [ ] `/profile/:userId`
- [ ] `/profile/edit`
- [ ] `/settings/notifications`
- [ ] `/support/chats`
- [ ] `/admin`
- [ ] `/dashboard/admin`
- [ ] `/chat/:transactionId`
- [ ] `*` (404 fallback)

## Admin frontend routes
- [ ] `/auth`
- [ ] `/dashboard`
- [ ] `/users`
- [ ] `/channels`
- [ ] `/offers`
- [ ] `/matches`
- [ ] `/history`
- [ ] `/system`
- [ ] `/incidents`
- [ ] `/demo-content`
- [ ] `/support`

## Key role/permission checks
- [ ] Non-admin cannot access admin frontend protected pages.
- [ ] Only admin role can open `/api/admin/*`.
- [ ] User can open public offers list/details without auth.
- [ ] User cannot send exchange proposal without auth.

## API stability checks
- [ ] No CORS rejection for origins `5173` and `5174`.
- [ ] No accidental 429 locally under normal navigation.
- [ ] Support chat messages with image payload are accepted.

## Current automated status
- Root tests: PASS
- Client lint: PASS
- Server lint: PASS
- Client build: PASS
- Admin build: PASS

## Notes
- Bundle split is implemented via lazy routes in `client/src/App.jsx`.
- Remaining work is manual browser pass against this checklist.
