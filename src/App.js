import './App.css';
import { useCallback, useState } from 'react';
import CountDownTimer from './components/CountDownTimer';
import Map from './components/Map';
import Weather from './components/Weather';
import { computeRandomDestination } from './utils/GeoData';

export default function App() {
  // Inital state The Social Hub Vienna
  const [center, setCenter] = useState({
    lat: 48.223415757807906,
    lng: 16.390110631145077,
  });

  const handleElapsedTimer = useCallback(() => {
    setCenter((prevCenter) => computeRandomDestination(prevCenter, 50, 10));
    console.log('Timer elapsed.');
  }, []);

  return (
    <div className="App">
      <main>
        <CountDownTimer handleElapsedTimer={handleElapsedTimer} />
        <Weather center={center} />
        <Map center={center} zoom={13} popUp="The Social Hub" />
      </main>
    </div>
  );
}
