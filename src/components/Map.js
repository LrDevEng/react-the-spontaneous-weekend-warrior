import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

// Set up the default icon for markers
const defaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
});
L.Marker.prototype.options.icon = defaultIcon;

function Map({ center, zoom, popUp }) {
  const mapRef = useRef(null);

  useEffect(() => {
    try {
      mapRef.current.setView(center, zoom);
    } catch (error) {
      console.log(error);
    }
  }, [center, zoom]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      ref={mapRef}
      style={{ height: '400px', width: '100vw' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={center}>
        <Popup>{popUp}</Popup>
      </Marker>
    </MapContainer>
  );
}

export default Map;
