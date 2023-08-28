import React, { useState, useEffect } from 'react';

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });

  useEffect(() => {
    let intervalId;

    const startTimer = () => {
      intervalId = setInterval(() => {
        if (timeLeft.seconds === 59) {
          setTimeLeft({ minutes: timeLeft.minutes + 1, seconds: 0 });
        } else {
          setTimeLeft({ minutes: timeLeft.minutes, seconds: timeLeft.seconds + 1 });
        }
        // if (timeLeft.seconds === 0) {
        //   if (timeLeft.minutes === 0) {
        //     clearInterval(intervalId);
        //   } else {
        //     setTimeLeft({ minutes: timeLeft.minutes - 1, seconds: 59 });
        //   }
        // } else {
        //   setTimeLeft({ minutes: timeLeft.minutes, seconds: timeLeft.seconds - 1 });
        // }
      }, 1000);
    };

    startTimer();

    return () => {
      clearInterval(intervalId);
    };
  }, [timeLeft]);

  return (
    <div>
      <h1>Countdown Timer</h1>
      <p>
        {timeLeft.minutes.toString().padStart(2, '0')}:
        {timeLeft.seconds.toString().padStart(2, '0')}
      </p>
    </div>
  );
}

export default CountdownTimer;