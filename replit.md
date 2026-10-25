# Présentation scolaire sur les djinns

Présentation interactive en français, avec une console d’orateur et une vue de projection synchronisée.

## Run & Operate

- The `artifacts/djinns-presentation: web` workflow runs the app.
- `pnpm --filter @workspace/djinns-presentation run typecheck` — typecheck the presentation.
- `pnpm run typecheck` — typecheck the full workspace.
- `pnpm run build` — typecheck and build workspace packages.
- `pnpm --filter @workspace/api-server run dev` — run the separate starter API service.
- No database or app secrets are required by the presentation.

## Stack

- pnpm workspace, Node.js 24, TypeScript, React, Vite, Tailwind CSS.
- The presentation is built as a static single-page app.
- The shared Express API and Drizzle/PostgreSQL libraries are workspace scaffolding; the presentation does not call them.

## Where things live

See `CODEBASE_INDEX.md` for the concise package map, app routes, and the source of truth for projection synchronization.

## Architecture decisions

- The app is static and keeps presentation state in the browser, so no server-side database is involved.
- Speaker and projection views synchronize through browser storage and `BroadcastChannel`; use both pages in the same browser profile for live sync.

## Product

The speaker view lets the presenter choose the content and control media; `/projection` is the separate audience-facing visual display.

## User preferences

See `.agents/memory/presentation-video-audio.md` for the project-specific rule about the original Pazuzu clip's audio.

## Gotchas

- The presenter console at `/` is not protected by authentication. Do not treat its notes or controls as private after publishing.
- Projection synchronization uses browser-local state and is not a cross-device realtime service.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
