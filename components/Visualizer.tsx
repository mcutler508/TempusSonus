import React, { useEffect, useState } from 'react';

export const Visualizer = ({ isPlaying }: { isPlaying: boolean }) => {
  const [heights, setHeights] = useState<number[]>(Array(20).fill(10));

  useEffect(() => {
    if (!isPlaying) {
      setHeights(Array(20).fill(10));
      return;
    }

    const interval = setInterval(() => {
      setHeights(prev => prev.map(() => Math.random() * 80 + 10));
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="w-full flex items-end justify-center gap-1 h-12 opacity-50">
      {heights.map((h, i) => (
        <div 
          key={i} 
          className="w-2 bg-amber-600/40 rounded-t-sm transition-all duration-100"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
};