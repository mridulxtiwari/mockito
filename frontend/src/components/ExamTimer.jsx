import React, { useEffect } from 'react';

export default function ExamTimer({ secondsLeft, onTick, onExpire }) {
  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire();
      return;
    }

    const interval = setInterval(() => {
      onTick();
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, onTick, onExpire]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  let timerClass = 'timer-box';
  if (secondsLeft < 60) {
    timerClass += ' urgent';
  } else if (secondsLeft < 180) {
    timerClass += ' warning';
  }

  return (
    <div className={timerClass} title="Time Remaining">
      <span>⏱️</span>
      <span>{formattedTime}</span>
    </div>
  );
}
