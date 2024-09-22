import 'leaflet/dist/leaflet.css';
import { useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

function Map() {
  const mapRef = useRef(null);

  function set() {
    mapRef.current.setView(
      {
        lat: 46.22344054136225,
        lng: 14.390087610396407,
      },
      13,
    );
  }

  return (
    <>
      <MapContainer
        center={{
          lat: 48.22344054136225,
          lng: 16.390087610396407,
        }}
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
      <button onClick={set}>Set</button>
    </>
  );
}

export default Map;
