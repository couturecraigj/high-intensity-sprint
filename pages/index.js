import { useEffect, useState } from "react";

const useInput = (wrapper = v => v) => {
  const [value, setValue] = useState(wrapper(""));
  return [value, e => setValue(wrapper(e.target.value))];
};

const useDistance = () => {
  function calculateDistance(lat1, lon1, lat2, lon2, unit = "K") {
    if (lat1 == lat2 && lon1 == lon2) {
      return 0;
    } else {
      var radlat1 = (Math.PI * lat1) / 180;
      var radlat2 = (Math.PI * lat2) / 180;
      var theta = lon1 - lon2;
      var radtheta = (Math.PI * theta) / 180;
      var dist =
        Math.sin(radlat1) * Math.sin(radlat2) +
        Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
        dist = 1;
      }
      dist = Math.acos(dist);
      dist = (dist * 180) / Math.PI;
      dist = dist * 60 * 1.1515;
      if (unit == "K") {
        dist = dist * 1.609344;
      }
      if (unit == "N") {
        dist = dist * 0.8684;
      }
      return dist;
    }
  }
  const [distance, setDistance] = useState();
  const [lastGeopoint, setLastGeopoint] = useState([]);
  const [started, setStarted] = useState();
  const [rafId, setRafId] = useState();
  const [finished, setFinished] = useState();
  const start = geopoint => {
    setFinished(false);
    setLastGeopoint(geopoint);
    setDistance(0);
    setStarted(true);
    cancelAnimationFrame(rafId);
  };
  const finish = () => {
    setLastGeopoint();
    setFinished(true);
    cancelAnimationFrame(rafId);
  };
  const addGeopoint = coords => {
    if (finished) return;
    setLastGeopoint(coords);
  };
  const addDistance = newDistance => {
    if (finished) return;
    setDistance(distance + newDistance);
  };
  const updateTraveled = geopoint => () => {
    navigator.geolocation.getCurrentPosition(position => {
      if (geopoint) {
        addDistance(
          calculateDistance(
            geopoint.latitude,
            geopoint.longitude,
            position.coords.latitude,
            position.coords.longitude
          )
        );
      }
      console.log(geopoint);
      addGeopoint(position.coords);
    }, console.error);
  };
  useEffect(() => {
    if (started && !finished) {
      setRafId(requestAnimationFrame(updateTraveled(lastGeopoint)));
    }
    if (finished) {
      cancelAnimationFrame(rafId);
    }
    if (!lastGeopoint) {
      cancelAnimationFrame(rafId);
    }
  }, [started, finished, lastGeopoint]);
  return [distance, start, finish];
};

const useTimer = () => {
  const [timePassed, setTimePassed] = useState();
  const [startTime, setStartTime] = useState();
  const [endTime, setEndTime] = useState();
  const [rafId, setRafId] = useState();
  const startTimer = () => {
    setEndTime(undefined);
    setStartTime(performance.now());
  };
  const stopTimer = () => {
    setEndTime(performance.now());
  };
  const updateTimePassed = timeStamp => {
    setTimePassed(timeStamp - startTime);
  };
  useEffect(() => {
    if (startTime && !endTime) {
      setRafId(requestAnimationFrame(updateTimePassed));
    }
    if (endTime) {
      cancelAnimationFrame(rafId);
    }
  }, [timePassed, startTime, endTime]);
  return [timePassed, startTimer, stopTimer];
};

const HomePage = () => {
  const [speed, setSpeed] = useState();
  const [lengthOfSprint, setLengthOfSprint] = useInput(v => +v);
  const [lengthOfBreak, setLengthOfBreak] = useInput(v => +v);
  const [state, setState] = useState("stop");
  const [watchId, setWatchId] = useState();
  const [timePassed, startTimer, stopTimer] = useTimer();
  const [distance, startDistance, stopDistance] = useDistance();
  const stop = () => {
    stopTimer();
    stopDistance();
  };
  const start = geopoint => {
    startTimer();
    startDistance(geopoint);
  };
  useEffect(() => {
    if (lengthOfSprint && timePassed >= lengthOfSprint) {
      stop();
    }
  }, [lengthOfSprint, timePassed]);
  useEffect(() => {
    navigator.geolocation.clearWatch(watchId);
    if (state === "start") {
      start();
    }
    if (state === "stop") {
      stop();
    }
    if (state === "activateOnMove") {
      setWatchId(
        navigator.geolocation.watchPosition(position => {
          if (Math.floor(position.coords.speed * 2.237)) {
            setSpeed((position.coords.speed * 2.237).toFixed(2));
            start(position.coords);
          }
        })
      );
    }
  }, [state]);
  return (
    <div>
      <div>{timePassed ? timePassed.toFixed(2) : ""}</div>
      {speed && <div>{speed}</div>}
      {!!distance && <div>{`Traveled: ${distance}KM`}</div>}
      <div>
        <label>
          How long would you like to sprint?
          <div>
            <input value={lengthOfSprint} onChange={setLengthOfSprint} />
          </div>
        </label>
      </div>

      <div>
        <label>
          How long would you like to take a break for?
          <div>
            <input value={lengthOfBreak} onChange={setLengthOfBreak} />
          </div>
        </label>
      </div>
      <div>
        <button type="button" onClick={() => setState("start")}>
          Start Now
        </button>
        <button type="button" onClick={() => setState("stop")}>
          Stop Now
        </button>
        <button type="button" onClick={() => setState("activateOnMove")}>
          Start Once I move
        </button>
      </div>
    </div>
  );
};

export default HomePage;
