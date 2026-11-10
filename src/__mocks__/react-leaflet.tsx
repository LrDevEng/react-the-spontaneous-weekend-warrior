// Manual Jest mock for react-leaflet (ESM-only, needs a real canvas/layout).
// Jest picks it up automatically because it sits in a `__mocks__` folder at
// the Jest root (`src/`); tests also call `jest.mock('react-leaflet')` to make
// it explicit.
//
// MapContainer mimics the real react-leaflet 4 lifecycle that the app relies on:
// - the Leaflet map is created in a callback ref on the first commit, so the
//   forwarded ref is still `null` during the first effects and only points to
//   the map instance after the following re-render,
// - children are only rendered once the map exists,
// - `center`/`zoom` only set the initial view; later changes have to go
//   through `map.setView()` (recorded in `leafletMock.setViewCalls`).
import {
  forwardRef,
  type ReactNode,
  useCallback,
  useImperativeHandle,
  useState,
} from 'react';
import {
  createMockLeafletMap,
  formatPosition,
  type MockLeafletMap,
} from '../testUtils/leafletMock';

type MapContainerProps = {
  center?: unknown;
  zoom?: number;
  className?: string;
  children?: ReactNode;
};

export const MapContainer = forwardRef<
  MockLeafletMap | null,
  MapContainerProps
>(function MapContainer({ center, zoom, className, children }, forwardedRef) {
  const [map, setMap] = useState<MockLeafletMap | null>(null);

  // `null` until the map has been created, like react-leaflet
  useImperativeHandle<MockLeafletMap | null, MockLeafletMap | null>(
    forwardedRef,
    () => map,
    [map],
  );

  const containerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node !== null && map === null) {
        setMap(createMockLeafletMap(center, zoom));
      }
    },
    // Like react-leaflet: the map is created once, from the initial props
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div
      data-testid="map-container"
      className={className}
      data-center={formatPosition(center)}
      data-zoom={String(zoom)}
      ref={containerRef}
    >
      {map ? children : null}
    </div>
  );
});

export function TileLayer({
  url,
  attribution,
}: {
  url: string;
  attribution?: string;
}) {
  return (
    <div
      data-testid="tile-layer"
      data-url={url}
      data-attribution={attribution}
    />
  );
}

export function Marker({
  position,
  children,
}: {
  position: unknown;
  children?: ReactNode;
}) {
  return (
    <div data-testid="marker" data-position={formatPosition(position)}>
      {children}
    </div>
  );
}

export function Popup({ children }: { children?: ReactNode }) {
  return <div data-testid="popup">{children}</div>;
}
