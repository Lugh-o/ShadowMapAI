<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ShadowMap AI - Agent Instructions

## Project Structure

This is a **pnpm monorepo** with the following structure:

- `apps/web/` - Next.js 16 app (dashboard, maps, API routes)
- `apps/vegetation-job/` - Python job for satellite vegetation classification
- `packages/types/` - Shared TypeScript types
- `packages/db/` - Prisma schema and database client
- `packages/species-data/` - Native species database

## Development Commands

```bash
# From root
pnpm dev                    # Start web app
pnpm build                  # Build web app
pnpm lint                   # Lint web app
pnpm db:generate            # Generate Prisma client
pnpm db:push                # Push schema to database
pnpm db:seed                # Seed database

# From apps/web
pnpm dev                    # Start Next.js dev server
pnpm build                  # Build Next.js app
```

## Key Files

- `apps/web/app/api/points/route.ts` - Points CRUD API
- `apps/web/app/api/priority/route.ts` - Climate priority index
- `apps/web/app/api/assistant/route.ts` - NLP assistant (Gemini)
- `apps/web/app/api/species/route.ts` - Species recommender
- `apps/web/app/api/admin/route.ts` - Moderation API
- `apps/web/components/ShadowMapDashboard.tsx` - Main dashboard component
- `packages/db/prisma/schema.prisma` - Database schema
- `packages/types/src/index.ts` - Shared TypeScript types

## API Conventions

- All API routes use Next.js App Router format
- Rate limiting is applied per IP (configurable via env vars)
- Points require moderation (status: pending/approved/rejected)
- Admin routes require an authenticated session whose e-mail is listed in `ADMIN_EMAILS`

## Environment Variables

See `apps/web/.env.example` for required configuration.

## Database

Uses PostgreSQL with PostGIS extension. Recommended providers:
- Neon (free tier)
- Supabase (free tier)

Schema is defined in `packages/db/prisma/schema.prisma`.
