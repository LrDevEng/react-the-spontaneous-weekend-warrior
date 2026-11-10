import { jest } from '@jest/globals';

// Controllable replacement for `globalThis.fetch` (jsdom has none).
// Every call is recorded; responses can be produced immediately by a handler
// or later via `call.respond(data)` / `call.fail(error)`.
// Like the real fetch, a pending call rejects with an AbortError once its
// AbortSignal is aborted.

export type FetchCall = {
  url: string;
  signal: AbortSignal | null;
  respond: (data: unknown) => void;
  fail: (error: Error) => void;
};

/** Value returned by a handler: JSON body, an Error (network failure), or `undefined` to leave the call pending */
export type FetchHandler = (url: string) => unknown;

function createAbortError() {
  const error = new Error('The user aborted a request.');
  error.name = 'AbortError';
  return error;
}

export function installFetchMock(handler?: FetchHandler) {
  const calls: FetchCall[] = [];

  const fetchMock = jest.fn(
    (input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((resolve, reject) => {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        const signal = init?.signal ?? null;
        let settled = false;

        const call: FetchCall = {
          url,
          signal,
          respond(data) {
            if (settled) return;
            settled = true;
            const response: Pick<Response, 'json' | 'ok' | 'status'> = {
              ok: true,
              status: 200,
              json: () => Promise.resolve(data),
            };
            // Only json() is used by the app
            resolve(response as Response);
          },
          fail(error) {
            if (settled) return;
            settled = true;
            reject(error);
          },
        };

        if (signal?.aborted) {
          call.fail(createAbortError());
        }
        signal?.addEventListener('abort', () => call.fail(createAbortError()));
        calls.push(call);

        if (handler) {
          const result = handler(url);
          if (result instanceof Error) {
            call.fail(result);
          } else if (result !== undefined) {
            call.respond(result);
          }
        }
      }),
  );

  globalThis.fetch = fetchMock;

  return { fetchMock, calls };
}

// Sample OpenWeatherMap current-weather response
export function weatherResponse({
  name = 'Vienna',
  description = 'light rain',
  temp = 288.15,
  feelsLike = 287.5,
  humidity = 81,
}: {
  name?: string;
  description?: string;
  temp?: number;
  feelsLike?: number;
  humidity?: number;
} = {}) {
  return {
    coord: { lon: 16.39, lat: 48.22 },
    weather: [{ id: 500, main: 'Rain', description, icon: '10d' }],
    main: {
      temp,
      feels_like: feelsLike,
      temp_min: temp - 1,
      temp_max: temp + 1,
      pressure: 1012,
      humidity,
    },
    name,
    cod: 200,
  };
}

// Parses the query of an OpenWeatherMap URL into its parameters
export function weatherUrlParams(url: string) {
  const parsed = new URL(url);
  return {
    origin: parsed.origin,
    pathname: parsed.pathname,
    lat: parsed.searchParams.get('lat'),
    lon: parsed.searchParams.get('lon'),
    appid: parsed.searchParams.get('appid'),
  };
}
