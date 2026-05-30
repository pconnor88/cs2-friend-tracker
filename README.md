# CS2 Friend Tracker

A personal React dashboard that pulls match data from the Leetify public API for a small group of friends, aggregates each player's CS2 stats, and ranks them head-to-head. Built with Vite + React 19 + TypeScript and deployed to Azure Static Web Apps. Stores match history locally via Dexie/IndexedDB to avoid repeated fan-out fetches.

## Setup

```bash
npm install
```

Edit `src/config/players.ts` and fill in the real Steam64 IDs of the three tracked players before running against the live Leetify API.

## Scripts

```bash
npm run dev       # start Vite dev server (port 5173)
npm test          # run vitest suite once
npm run test:watch
npm run build     # type-check + production build to dist/
npm run preview   # preview the production build locally
npm run lint
```

## Deployment

Pushes to `main` deploy via the workflow in `.github/workflows/azure-static-web-apps.yml`. The deploy token must be set as the `AZURE_STATIC_WEB_APPS_API_TOKEN` GitHub secret.
