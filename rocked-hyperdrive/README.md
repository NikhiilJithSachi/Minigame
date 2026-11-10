# RockED Hyperdrive: deploy package

A 45-second, mobile-first 2.5D arcade run. One static page, one Netlify Function, three Supabase tables.

## What is in here

| Path | What it is |
| --- | --- |
| `public/index.html` | The whole game: canvas renderer, synthesised audio, UI. No assets, no build step, about 100 KB uncompressed. |
| `netlify/functions/api.mjs` | `POST /api/pilots`, `POST /api/runs/start`, `POST /api/runs/finish`, `GET /api/leaderboard`. No npm dependencies. |
| `supabase/migrations/0001_hyperdrive.sql` | Tables, indexes, RLS lock-down, the transactional finish function, the ranking query, retention cleanup. |
| `netlify.toml` | Publish dir, function dir, security headers. |
| `src/` + `build.py` | Readable sources. `python3 build.py` regenerates `public/index.html`. |

## Deploy

1. Create two Supabase projects (development and production). Run the migration in each.
2. In Netlify, set these environment variables, scoped so **Production** uses the production project and **Deploy previews / branch deploys** use development:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (Functions scope only, never exposed to the build)
   - `RUN_TOKEN_SECRET` (any 32+ random bytes)
   - optional: `PAUSE_BUDGET_S` (default 120), `SCORE_HARD_CAP` (default 90000)
3. Deploy the folder. Rollback is Netlify's "Publish deploy" on any earlier deploy.
4. Schedule `select hd_cleanup()` daily (pg_cron line is at the bottom of the migration).

The page picks its backend on load. If `/api/leaderboard` answers, it uses the API. If not, it drops to practice mode and says so on screen: scores stay on the device and nothing claims to be saved.

## Status: read before you ship

- The **game client** was playtested in headless Chromium at 360 px wide: full 45 s runs, pause, emergency recovery, name validation, results, leaderboard states. The simulation is deterministic for a given seed.
- The **API and SQL have not been run against a live Supabase project.** They pass a syntax check only. Treat them as a reviewed first draft: run the QA matrix in section 13 of the spec against a dev project before launch.
- `HARD_CAP` and the `CEIL` table in `api.mjs` are conservative ceilings for course version 1. Recalibrate them whenever the wave schedule or scoring changes, and bump the major version so the leaderboard starts a new season.
- Scores are validated, not proven. The browser runs the game, so a determined person can forge a plausible score. This matches the spec's "casual competition" decision.

## Where this build goes beyond the V1 spec

- **Weekly seeded course.** Everyone flies the same route each week, so scores compare fairly. The seed rolls over with the Monday 00:00 Asia/Kolkata reset.
- **Pace line.** The HUD shows how far ahead or behind your own best run you are, second by second.
- **Flight report.** Results break the run down (crystals, takedowns, near misses, top combo, hits, boss time) and award a dealership rank from Green Pea to Dealer Principal.
- **Rival gap.** Results and leaderboard say exactly how many points you need to pass the pilot above you.
- **Adaptive soundtrack.** A synthesised sequencer adds layers per phase. Zero audio files. Haptics on supported phones.
- **Fairness by construction.** The course generator keeps one lane open in every row and moves it at most one lane per row, so no pattern is unavoidable.
- **Victory lap.** Beating the boss early turns the remaining seconds into a crystal shower.
- **Auto quality.** Frame time is watched and effects scale down on slow phones. A "Reduced effects" switch and `prefers-reduced-motion` are honoured.
- **Copy result** for sharing a score in chat.

## Deviations from the spec to confirm

- **Pause vs. the submission window.** The spec allows pause but also caps submission at 45 s + 15 s. A paused run would expire. The API adds a pause budget (default 120 s). Set `PAUSE_BUDGET_S=0` to enforce the strict window.
- **Shield power-up** restores one pip and adds an 8 s bubble that absorbs one hit.
- **Boost** also pulls in nearby crystals while active.
- **Tuning values** in `CFG` (top of `src/1-core.js`) are still the spec's proposed starting points, not playtest results from people.
