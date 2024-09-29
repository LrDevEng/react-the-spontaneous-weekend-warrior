import './App.css';
import { useCallback, useState } from 'react';
import CountDownTimer from './components/CountDownTimer';
import DestinationForm from './components/DestinationForm';
import Map from './components/Map';
import Weather from './components/Weather';
import { computeRandomDestination } from './utils/GeoData';

const startLocation = {
  coordinates: {
    lat: 48.223415757807906,
    lng: 16.390110631145077,
  },
  name: 'The Social Hub',
};

export default function App() {
  // State for location: Initial position 'The Social Hub Vienna'
  const [center, setCenter] = useState(startLocation.coordinates);
  const [minDist, setMinDist] = useState(10);
  const [maxDist, setMaxDist] = useState(50);
  const [disableDestForm, setDisableDestForm] = useState(false);
  const [popUp, setPopUp] = useState(startLocation.name);

  // Callback function triggered when timer elapses
  const handleElapsedTimer = useCallback(() => {
    // Set maximum distance to minimum distance in case it is smaller than the minimum distance
    const maxDistChecked = Math.max(maxDist, minDist);
    setCenter((prevCenter) =>
      computeRandomDestination(prevCenter, maxDistChecked, minDist),
    );
    setDisableDestForm(false);
    setPopUp('Your Destination');
  }, [maxDist, minDist]);

  function handleTimerStart() {
    setDisableDestForm(true);
  }

  function handleTimerReset() {
    setCenter(startLocation.coordinates);
    setPopUp(startLocation.popUp);
    setDisableDestForm(false);
  }

  return (
    <div className="App">
      <header className="Header">
        <h1>The Spontanious Weekend Warrior</h1>
      </header>
      <main className="Main">
        <section>
          <h5>
            Choose a date, time and distance for your next adventure and start
            the timer. When the countdown hits 0 you will be presented with a
            random destination to visit on the map.
          </h5>
          <div className="Responsive">
            <div>
              <CountDownTimer
                handleElapsedTimer={handleElapsedTimer}
                handleTimerStart={handleTimerStart}
                handleTimerReset={handleTimerReset}
              />
              <DestinationForm
                minDist={minDist}
                setMinDist={setMinDist}
                maxDist={maxDist}
                setMaxDist={setMaxDist}
                disabled={disableDestForm}
              />
            </div>
            <Weather center={center} />
          </div>
        </section>
        <div className="Attribution">
          <div>
            Background designed by{' '}
            <a href="https://www.freepik.com/">Freepik</a>
          </div>
        </div>
        <section className="Map">
          <Map
            center={center}
            zoom={13}
            popUp={popUp}
            align={disableDestForm}
          />
        </section>
      </main>
    </div>
  );
}
