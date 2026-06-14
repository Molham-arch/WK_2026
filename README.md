# Matchday 26

A responsive World Cup 2026 dashboard for live scores, fixtures, results, and
group standings. It is built with Next.js, TypeScript, and Tailwind CSS.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The site uses the free WorldCup26 Community API when no paid data provider is
available. Community feeds can occasionally update more slowly than official
commercial feeds. If both live sources are unavailable, the interface falls
back to clearly labelled demo data.

## Connect live data

1. Create an account at [API-Football](https://www.api-football.com/).
2. Copy `.env.example` to `.env.local`.
3. Add your API key:

```env
API_FOOTBALL_KEY=your_api_football_key
WORLD_CUP_DATA_PROVIDER=api-football
```

Restart the development server. The server fetches World Cup fixtures and
standings using `league=1` and `season=2026`, keeps the key out of the browser,
and refreshes the page data every 30 seconds. Leave
`WORLD_CUP_DATA_PROVIDER` unset or set it to `community` to use the free feed.

## Checks

```bash
npm run lint
npm run build
```
