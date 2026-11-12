import { describe, expect, test } from '@jest/globals';
import * as legacyWeatherModule from '../../__legacy__/components/Weather';
import * as liveWeatherModule from '../../components/Weather';

// Guards the B2B setup itself: the "live" imports used by the B2B tests must
// resolve to the TypeScript sources and the "legacy" imports to the frozen JS
// copies, otherwise the comparison would silently be legacy vs legacy.

const modules = [
  'App',
  'components/CountDownCard',
  'components/CountDownTimer',
  'components/DateTimePicker',
  'components/DestinationForm',
  'components/Map',
  'components/Weather',
  'utils/GeoData',
  'utils/Parsers',
];

// Same relative specifiers as the B2B test files (src/__tests__/b2b/*)
const livePath = (name: string) => require.resolve(`../../${name}`);
const legacyPath = (name: string) =>
  require.resolve(`../../__legacy__/${name}`);

describe('B2B module resolution', () => {
  test.each(modules)(
    'live %s resolves to a .ts/.tsx file outside __legacy__',
    (name) => {
      const resolved = livePath(name);
      expect(resolved).toMatch(new RegExp(`/src/${name}\\.tsx?$`));
      expect(resolved).not.toContain('__legacy__');
    },
  );

  test.each(modules)('legacy %s resolves to the frozen .js copy', (name) => {
    expect(legacyPath(name)).toMatch(
      new RegExp(`/src/__legacy__/${name}\\.js$`),
    );
  });

  test('live and legacy modules are different module instances', () => {
    expect(liveWeatherModule.default).not.toBe(legacyWeatherModule.default);
  });
});
