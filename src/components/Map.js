import 'leaflet/dist/leaflet.css';
import { useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

function Map() {
  const mapRef = useRef(null);
  const latViennaSocialHub = 48.22344054136225;
  const longViennaSocialHub = 16.390087610396407;

  return (
    <div style={{ height: '200px' }}>
      <MapContainer
        center={[latViennaSocialHub, longViennaSocialHub]}
        zoom={13}
        ref={mapRef}
        style={{ height: '400px', width: '100vw' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Additional map layers or components can be added here */}
      </MapContainer>
    </div>
  );
}

export default Map;
