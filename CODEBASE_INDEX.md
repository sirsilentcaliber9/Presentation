# Codebase index

## Product

An interactive French-language school presentation about djinns. The speaker uses the presenter console, while a separate projection view shows the selected image or video. Both views synchronize inside the same browser profile.

## Main app

`artifacts/djinns-presentation/` is the publishable React + Vite application.

- `src/pages/presenter.tsx` — presenter controls, five reading pages across two chapters, speaker notes, and phrase-linked media.
- `src/pages/projection.tsx` — audience-facing projection screen, full-screen Utukku image, chapter titles, and video playback.
- `src/lib/projection-state.ts` — shared browser state and synchronization via `localStorage` and `BroadcastChannel`.
- `src/assets/` — images and video clips bundled with the presentation, including the Chapter 1 and Chapter 2 clips.
- `public/` — favicon and crawler directives.
- `src/index.css` — app theme and presentation styles.
- `index.html` — document title, French language, and social/search metadata.

Routes:

- `/` — presenter console.
- `/projection` — projection view.

The console is not authentication-protected. It should not be treated as private when the site is published. Projection sync is browser-local; the two views need to be open in the same browser profile.
The six added chapter clips are configured with audio; a browser that blocks autoplay may require pressing the on-screen play button.

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
