import React from "react";

export default function Loader({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={className} style={style}>
      <div className="flex flex-col items-center">
        <div className="text-center text-sm text-gray-600 animate-blink">
          {Math.random() < 0.5 ? "waiting for grok" : "aligning stars..."}
        </div>
        <div className="shooting-star"></div>
      </div>
    </div>
  );
}