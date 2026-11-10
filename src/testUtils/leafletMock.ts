// Shared state of the react-leaflet mock (src/__mocks__/react-leaflet.tsx).
// Tests read it to assert what the Map component did with the Leaflet map
// instance it receives through the MapContainer ref.

export type LatLngLike = { lat: number; lng: number };

export type MockLeafletMap = {
  id: number;
  initialCenter: unknown;
  initialZoom: unknown;
  setView: (center: unknown, zoom: unknown) => MockLeafletMap;
};

export type SetViewCall = { mapId: number; center: unknown; zoom: unknown };

export const leafletMock = {
  maps: [] as MockLeafletMap[],
  setViewCalls: [] as SetViewCall[],
  reset() {
    leafletMock.maps = [];
    leafletMock.setViewCalls = [];
  },
};

export function createMockLeafletMap(center: unknown, zoom: unknown) {
  const map: MockLeafletMap = {
    id: leafletMock.maps.length + 1,
    initialCenter: center,
    initialZoom: zoom,
    setView(newCenter, newZoom) {
      leafletMock.setViewCalls.push({
        mapId: map.id,
        center: newCenter,
        zoom: newZoom,
      });
      return map;
    },
  };
  leafletMock.maps.push(map);
  return map;
}

// Stable string form of a position for data attributes ("lat,lng")
export function formatPosition(position: unknown) {
  if (
    typeof position === 'object' &&
    position !== null &&
    'lat' in position &&
    'lng' in position
  ) {
    return `${String(position.lat)},${String(position.lng)}`;
  }
  return JSON.stringify(position);
}
