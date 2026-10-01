import { useEffect, useRef, useState } from 'react';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Counts down from durationSeconds and calls onExpire once when it hits 0. */
export default function Timer({ durationSeconds, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire?.();
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onExpire]);

  const low = timeLeft <= 30;
  return <span className={`timer${low ? ' timer-low' : ''}`}>⏱ {formatTime(timeLeft)}</span>;
}
