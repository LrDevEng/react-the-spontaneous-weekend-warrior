# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"The Spontaneous Weekend Warrior": the user picks a future date/time and a min/max distance, starts a countdown, and when it hits zero the app picks a random destination around a fixed start point (The Social Hub, Vienna), shows it on a Leaflet map and fetches current weather for it from OpenWeatherMap. Deployed on Netlify (`netlify.toml`: `pnpm run build`, publishes `build/`).

## Commands

Package manager is **pnpm** (pinned via `packageManager` in `package.json`; enable with `corepack enable`).

- `pnpm install`: install dependencies
- `pnpm start`: dev server on http://localhost:3000
- `pnpm build`: production build into `build/`
- `pnpm test`: Jest in watch mode (CRA). For a single non-interactive run: `CI=true pnpm test`
- Single test file / test name: `CI=true pnpm test -- src/__tests__/App.test.tsx` or `CI=true pnpm test -- -t "test name"`
- Type check: `pnpm exec tsc --noEmit` (covers app and test files)
- Lint (no script defined, run directly): `pnpm exec eslint .` and `pnpm exec stylelint "**/*.css"`
- Format: `pnpm exec prettier --write .`

Tooling comes from UpLeveled presets: `@upleveled/react-scripts` (a maintained fork of Create React App's `react-scripts`), `eslint-config-upleveled` (flat config, extended in `eslint.config.js` to ignore `src/__legacy__/`; also supplies `tsconfig.base.json`), `stylelint-config-upleveled`. `package.json` has `"type": "module"`, so config files are ESM. The app is strict TypeScript (`tsconfig.json` extends the UpLeveled base: `strict`, `noUncheckedIndexedAccess`); only the config files at the root are JS.

## Testing

- Tests live in `src/__tests__/` (helpers in `src/testUtils/`, global setup in `src/setupTests.ts`). They are characterization tests: they pin current behavior, including known quirks marked `NOTE: possible bug`.
- `react-leaflet` is mocked by `src/__mocks__/react-leaflet.tsx` (only `MapContainer`, `TileLayer`, `Marker`, `Popup`); extend the mock if a component imports anything else from it.
- `src/__legacy__/` is a frozen copy of the pre-TypeScript JS. The B2B tests (`src/__tests__/b2b/`) run legacy and live code on identical inputs (seeded `Math.random`, fake clock, mocked `fetch`) and require identical DOM and side effects. Never edit or port it; delete it together with the B2B tests once the TypeScript port is accepted. Intentional differences from legacy are pinned in `Weather.divergences.test.tsx`.
- Jest 29 runs through the CRA fork; `config/jest/*Transform.cjs` and the `jest.transform` key in `package.json` replace the fork's Jest 27-only transforms.

## Environment

`REACT_APP_OPEN_WEATHER_MAP_API_KEY` is required for weather data. Put it in `.env.local` (gitignored). CRA reads env files only at dev-server start and inlines `REACT_APP_*` values into the client bundle.

## Architecture

All state lives in `src/App.tsx` and flows down via props; there is no router, context or state library.

- **App state**: `center` (current map coordinates `{lat, lng}`), `minDist`/`maxDist` (km), `disableDestForm` (true while a countdown runs), `popUp` (marker label).
- **Countdown flow**: `CountDownTimer` owns the target date/time, an `endTime` timestamp (null when idle) and the displayed `timerValue` in seconds (-1 when idle). While running, an effect recomputes `timerValue` from `endTime - Date.now()` every second (never decrement a counter: background tabs throttle timers); when it reaches 0 it calls App's `handleElapsedTimer` (memoized with `useCallback` because it's an effect dependency). App's `handleTimerStart`/`handleTimerReset` toggle the form lock and reset the map.
- **Destination**: `utils/GeoData.ts` `computeRandomDestination` uses `geolib.computeDestinationPoint` with a random bearing and a distance uniformly distributed between min and max. It is always computed from the fixed start location. The distance inputs hold strings; `handleElapsedTimer` parses them and clamps them to `0 <= min <= max`.
- **Map**: `components/Map.tsx` wraps react-leaflet. `MapContainer`'s `center` prop only applies on mount, so an effect calls `mapRef.current.setView` whenever `center` changes. Leaflet's default marker icon is reconfigured manually because bundlers break its default image paths.
- **Weather**: `components/Weather.tsx` refetches from the OpenWeatherMap current-weather endpoint whenever `center` changes, aborting the previous request via `AbortController`. Temperatures arrive in Kelvin and are converted with `utils/Parsers.ts` `kelvinToCelcius`. On failure the API returns an error object (`{cod, message}`) rather than weather data; the response is typed as `WeatherData | WeatherApiError` (`src/types.ts`) and narrowed with `isWeatherData` (`utils/WeatherApi.ts`) before rendering.
- **Parsers**: `utils/Parsers.ts` converts between seconds, `Date`, and the `{days, hours, minutes, seconds}` / `{date: 'YYYY-MM-DD', time: 'HH:MM'}` string shapes used by the countdown and the native date/time inputs.
- **Types**: shared domain types (`Coordinates`, `CountDownTime`, `DateTimeInput`, weather API shapes) live in `src/types.ts`; `src/env.d.ts` types `process.env.REACT_APP_OPEN_WEATHER_MAP_API_KEY`.
- **Styling**: CSS Modules per component in `src/styles/*.module.css`, plus global `index.css`/`App.css`.
