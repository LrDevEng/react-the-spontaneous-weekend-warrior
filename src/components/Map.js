import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import styles from '../styles/Map.module.css';

// Set up the default icon for markers
const defaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
});
L.Marker.prototype.options.icon = defaultIcon;

function Map({ center, zoom, popUp, align }) {
  const mapRef = useRef(null);

  // Set center and zoom of map every time they change
  useEffect(() => {
    try {
      mapRef.current.setView(center, zoom);
    } catch (error) {
      console.log(error);
    }
  }, [center, zoom, align]);

  return (
    <MapContainer
      className={styles.map}
      center={center}
      zoom={zoom}
      ref={mapRef}
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
