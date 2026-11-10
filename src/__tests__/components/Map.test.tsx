import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import L from 'leaflet';
import Map from '../../components/Map';
import { leafletMock } from '../../testUtils/leafletMock';

// Uses src/__mocks__/react-leaflet.tsx
jest.mock('react-leaflet');

const vienna = { lat: 48.223415757807906, lng: 16.390110631145077 };
const graz = { lat: 47.0707, lng: 15.4395 };

beforeEach(() => {
  leafletMock.reset();
  // The Map effect logs the error of calling setView before the map exists
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

describe('Map', () => {
  test('renders the map container, OpenStreetMap tiles and a marker with the popup at the center', () => {
    render(
      <Map center={vienna} zoom={13} popUp="The Social Hub" align={false} />,
    );
    const container = screen.getByTestId('map-container');
    expect(container).toHaveClass('map');
    const tileLayer = screen.getByTestId('tile-layer');
    expect(tileLayer).toHaveAttribute(
      'data-url',
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    );
    expect(tileLayer).toHaveAttribute(
      'data-attribution',
      // JSX decodes the &copy; entity of the attribute string
      '\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    );
    expect(screen.getByTestId('marker')).toHaveAttribute(
      'data-position',
      `${vienna.lat},${vienna.lng}`,
    );
    expect(screen.getByTestId('popup')).toHaveTextContent(/^The Social Hub$/);
  });

  test('creates one map with the initial center and zoom and does not call setView on mount', () => {
    render(
      <Map center={vienna} zoom={13} popUp="The Social Hub" align={false} />,
    );
    expect(leafletMock.maps).toHaveLength(1);
    expect(leafletMock.maps[0]?.initialCenter).toEqual(vienna);
    expect(leafletMock.maps[0]?.initialZoom).toBe(13);
    // NOTE: the ref is still null when the mount effect runs (react-leaflet
    // creates the map after the first commit), so the initial view comes only
    // from MapContainer's center/zoom props
    expect(leafletMock.setViewCalls).toEqual([]);
  });

  test('calls setView(center, zoom) when center changes and moves the marker', () => {
    const { rerender } = render(
      <Map center={vienna} zoom={13} popUp="The Social Hub" align={false} />,
    );
    rerender(
      <Map center={graz} zoom={13} popUp="Your Destination" align={false} />,
    );
    expect(leafletMock.setViewCalls).toEqual([
      { mapId: 1, center: graz, zoom: 13 },
    ]);
    expect(screen.getByTestId('marker')).toHaveAttribute(
      'data-position',
      `${graz.lat},${graz.lng}`,
    );
    expect(screen.getByTestId('popup')).toHaveTextContent(/^Your Destination$/);
    // The map is not recreated
    expect(leafletMock.maps).toHaveLength(1);
  });

  test('calls setView again when changing back to the previous center', () => {
    const { rerender } = render(
      <Map center={vienna} zoom={13} popUp="a" align={false} />,
    );
    rerender(<Map center={graz} zoom={13} popUp="a" align={false} />);
    rerender(<Map center={vienna} zoom={13} popUp="a" align={false} />);
    expect(leafletMock.setViewCalls).toEqual([
      { mapId: 1, center: graz, zoom: 13 },
      { mapId: 1, center: vienna, zoom: 13 },
    ]);
  });

  test('calls setView when zoom changes', () => {
    const { rerender } = render(
      <Map center={vienna} zoom={13} popUp="a" align={false} />,
    );
    rerender(<Map center={vienna} zoom={10} popUp="a" align={false} />);
    expect(leafletMock.setViewCalls).toEqual([
      { mapId: 1, center: vienna, zoom: 10 },
    ]);
  });

  test('calls setView with the unchanged center when align changes', () => {
    const { rerender } = render(
      <Map center={vienna} zoom={13} popUp="a" align={false} />,
    );
    rerender(<Map center={vienna} zoom={13} popUp="a" align={true} />);
    rerender(<Map center={vienna} zoom={13} popUp="a" align={false} />);
    expect(leafletMock.setViewCalls).toEqual([
      { mapId: 1, center: vienna, zoom: 13 },
      { mapId: 1, center: vienna, zoom: 13 },
    ]);
  });

  test('does not call setView when only the popup text changes', () => {
    const { rerender } = render(
      <Map center={vienna} zoom={13} popUp="a" align={false} />,
    );
    rerender(<Map center={vienna} zoom={13} popUp="b" align={false} />);
    expect(leafletMock.setViewCalls).toEqual([]);
    expect(screen.getByTestId('popup')).toHaveTextContent(/^b$/);
  });

  test('configures the default Leaflet marker icon', () => {
    render(<Map center={vienna} zoom={13} popUp="a" align={false} />);
    const icon = L.Marker.prototype.options.icon;
    expect(icon).toBeInstanceOf(L.Icon);
    expect(icon?.options).toEqual(
      expect.objectContaining({
        iconUrl: 'marker-icon.png',
        shadowUrl: 'marker-shadow.png',
        iconSize: [24, 36],
        iconAnchor: [12, 36],
      }),
    );
  });
});
