# ADBWeb — Day 3 Log

**Goal for the day:** Build the Next.js gateway route (`/api/analyze`) that receives an upload from the browser and forwards it to the FastAPI inference service, proving the two services can talk to each other end-to-end.

**Status:** ✅ Complete

---

## What was built

### `app/api/analyze/route.ts` (new)

Next.js App Router convention: the folder path under `app/api/` *is* the URL path. `app/api/analyze/route.ts` means a `POST` request to `/api/analyze` runs this file.

The route:
1. Reads the incoming request as `FormData` and pulls out the uploaded file
2. Rejects the request early (400) if no file was sent
3. Repackages the file into a *new* `FormData` object and forwards it via `fetch()` to the FastAPI service's `/infer` endpoint
4. Returns a 502 if FastAPI's response isn't OK (e.g. the inference service is down)
5. Otherwise relays FastAPI's JSON response straight back to the caller

This is intentionally a thin relay for now — no validation, no error message customization yet. That's Day 4.

### `.env.local` (new)

```
FASTAPI_URL=http://127.0.0.1:8000
```

Holds the inference service's address as a config value rather than hardcoding it in `route.ts`. This matters for deployment later — when the app moves to the DCISM server, this one value changes instead of hunting through code. Next.js loads `.env.local` automatically; no extra setup needed. Confirmed it's covered by `.gitignore` so it's never committed.

---

## Two-port setup (source of confusion, worth documenting clearly)

Running the full stack locally now requires **two servers in two terminals simultaneously**:

| Terminal | Command | Port | Role |
|---|---|---|---|
| 1 | `uvicorn main:app --reload` (from `inference/`) | `8000` | FastAPI inference service |
| 2 | `npm run dev` (from project root) | `3000` | Next.js frontend + gateway route |

These are separate processes. A real browser only ever talks to port `3000`. The Next.js route's server-side code is what talks to port `8000` internally, via the `FASTAPI_URL` env variable — that call is invisible to the browser/client.

Full request chain when testing:
```
curl → localhost:3000/api/analyze (Next.js)
     → fetch() inside route.ts, using FASTAPI_URL
     → 127.0.0.1:8000/infer (FastAPI)
     → mock model → response
     ← relayed back through Next.js
     ← final JSON reaches curl
```

---

## Verified

With both servers running, tested from a third terminal:

```bash
curl -X POST "http://localhost:3000/api/analyze" -F "file=@C:/path/to/test.wav"
```

Got back the same JSON shape as hitting FastAPI directly (Day 2), now proven to travel the full path: browser-style request → Next.js route → FastAPI → mock model → relayed response.

---

## Not done yet / carried forward

- No validation in `route.ts` yet — any file, valid or not, gets forwarded to FastAPI as-is (Day 4)
- No handling yet for `REQ-ANALYSIS-4` (aborting inference if the user closes the tab/browser)
- Minor open item from Day 2: near-empty trailing audio chunks caused by MP3 duration imprecision — not yet addressed, doesn't block progress