import React, { useEffect, useState } from 'react';

export default function AudioVisualizer({ isRecording }) {
  const [heights, setHeights] = useState(Array(24).fill(10));

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setHeights(
          Array(24)
            .fill(0)
            .map(() => Math.floor(Math.random() * 38) + 8)
        );
      }, 90);
    } else {
      setHeights(Array(24).fill(6));
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <div className="waveform-canvas">
      {heights.map((h, i) => (
        <div
          key={i}
          className="waveform-bar"
          style={{
            height: `${h}px`,
            backgroundColor: isRecording ? (h > 28 ? '#f43f5e' : '#6366f1') : '#334460'
          }}
        />
      ))}
    </div>
  );
}
