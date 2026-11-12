import 'leaflet/dist/leaflet.css';
import L, { type Map as LeafletMap } from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import styles from '../styles/Map.module.css';
import type { Coordinates } from '../types';

// Set up the default icon for markers
const defaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
});
L.Marker.prototype.options.icon = defaultIcon;

type Props = {
  center: Coordinates;
  zoom: number;
  popUp: string;
  // Only used to re-run the setView effect (the countdown start/stop changes it)
  align: boolean;
};

function Map({ center, zoom, popUp, align }: Props) {
  // Leaflet map instance, set by react-leaflet once the map has been created
  const mapRef = useRef<LeafletMap>(null);

  // Set center and zoom of map every time they change
  useEffect(() => {
    try {
      // NOTE: on mount the ref is still null (react-leaflet creates the map
      // after the first commit), so like the JS version (which threw a
      // TypeError on `null.setView`) the mount effect only logs an error and
      // the initial view comes from MapContainer's center/zoom props
      if (mapRef.current === null) {
        throw new TypeError('Map instance not created yet, cannot set view');
      }
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
