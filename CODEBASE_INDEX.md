# Codebase index

## Product

An interactive French-language school presentation about djinns. The speaker uses the presenter console, while a separate projection view shows the selected image or video. Both views synchronize inside the same browser profile.

## Main app

`artifacts/djinns-presentation/` is the publishable React + Vite application.

- `src/pages/presenter.tsx` — presenter controls, eight reading pages across four chapters, speaker notes, and last-word media triggers.
- `src/pages/projection.tsx` — audience-facing route using the shared projection scene.
- `src/components/projection-scene.tsx` — identical visual renderer for presenter preview and projection, including preloaded video elements.
- `src/lib/presentation-media.ts` — central scene/media map and asset list for preloading.
- `src/lib/projection-state.ts` — shared browser state and synchronization via `localStorage` and `BroadcastChannel`.
- `src/assets/` — bundled images, source screenshots, and clips for all four chapters.
- `public/` — favicon and crawler directives.
- `src/index.css` — app theme and presentation styles.
- `index.html` — document title, French language, and social/search metadata.

Routes:

- `/` — presenter console.
- `/projection` — projection view.

The console is not authentication-protected. It should not be treated as private when the site is published. Projection sync is browser-local; the two views need to be open in the same browser profile.
The Pazuzu “monde” clip keeps its audio. Clips explicitly requested silent are muted individually; the presenter preview is muted to avoid duplicate sound.

## Workspace packages

- `artifacts/api-server/` — separate Express starter API with a health endpoint at `/api/healthz`; the presentation does not depend on it.
- `artifacts/mockup-sandbox/` — component-preview canvas tooling.
- `lib/api-spec/` — OpenAPI source for the shared API.
- `lib/api-client-react/` — generated React API client.
- `lib/api-zod/` — generated Zod API schemas.
- `lib/db/` — Drizzle/PostgreSQL starter package; the presentation does not use it.
- `scripts/` — workspace utility and post-merge scripts.

## Commands

- `pnpm --filter @workspace/djinns-presentation run typecheck`
- `pnpm --filter @workspace/djinns-presentation run build` (artifact build uses the configured workflow environment)
- `pnpm run typecheck`
- `pnpm run build`

## Project-specific media note

See `.agents/memory/presentation-video-audio.md` before changing video audio behavior.
