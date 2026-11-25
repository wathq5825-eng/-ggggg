# WAThIQ AI LIVE

Arabic-first livestream companion prototype for the Wathiq and Jakleeta host personas.

## Current state

This repository is a source snapshot exported from the Floot project. It is **not a ready-to-install Android APK** and does not currently connect to TikTok LIVE events. The current interface provides local demo events, browser speech synthesis, and a Floot-hosted AI reply endpoint.

## Important limitations

- TikTok LIVE event ingestion is not implemented.
- Android foreground audio service and native audio routing are not implemented.
- Browser speech preview is not guaranteed to be audible in a TikTok broadcast.
- The AI endpoint imports Floot's server-side `@floot/ai` service and therefore is not independently deployable without adapting that service.
- Robot images are referenced from the original Floot CDN and are not copied into this repository yet.

## Source layout

- `pages/_index.tsx` — Arabic RTL dashboard and demo interactions.
- `pages/_index.module.css` — dashboard styling.
- `endpoints/live/reply_POST.ts` — server-side AI reply handler for Floot.
- `endpoints/live/reply_POST.schema.ts` — request validation.
- `base.css` — global theme and typography.
- `static/__dev/dependencies.json` — dependency snapshot from Floot.

## Safety

The app is designed for voice-only responses. It must not send written replies to TikTok chat, request TikTok passwords, session cookies, or verification codes, or claim a live connection until a real connector is implemented and tested.
