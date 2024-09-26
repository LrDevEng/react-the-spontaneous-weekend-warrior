import './App.css';
import { useCallback, useState } from 'react';
import CountDownTimer from './components/CountDownTimer';
import DestinationForm from './components/DestinationForm';
import Map from './components/Map';
import Weather from './components/Weather';
import { computeRandomDestination } from './utils/GeoData';

export default function App() {
  // Inital state The Social Hub Vienna
  const [center, setCenter] = useState({
    lat: 48.223415757807906,
    lng: 16.390110631145077,
  });

  const [minDist, setMinDist] = useState(10);
  const [maxDist, setMaxDist] = useState(50);

  const [disableDestForm, setDisableDestForm] = useState(false);

  const handleElapsedTimer = useCallback(() => {
    // Set maximum distance to minimum distance in case it is smaller than the minimum distance
    const maxDistChecked = Math.max(maxDist, minDist);
    setCenter((prevCenter) =>
      computeRandomDestination(prevCenter, maxDistChecked, minDist),
    );
    setDisableDestForm(true);
    console.log('Timer elapsed.');
  }, [maxDist, minDist]);

  // --- Does not work ---
  // function handleElapsedTimer() {
  //   setCenter((prevCenter) => computeRandomDestination(prevCenter, 50, 10));
  //   console.log('Timer elapsed.');
  // }

  function handleTimerStart() {
    setDisableDestForm(true);
  }

  return (
    <div className="App">
      <main>
        <CountDownTimer
          handleElapsedTimer={handleElapsedTimer}
          handleTimerStart={handleTimerStart}
        />
        <DestinationForm
          minDist={minDist}
          setMinDist={setMinDist}
          maxDist={maxDist}
          setMaxDist={setMaxDist}
          disabled={disableDestForm}
        />
        <Weather center={center} />
        <Map center={center} zoom={13} popUp="The Social Hub" />
      </main>
    </div>
  );
}
