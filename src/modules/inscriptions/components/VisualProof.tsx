
import React from 'react';
import { StoneShape } from '@/shared/types/prototype.types';

interface VisualProofProps {
  id?: string;
  shape: StoneShape;
  lines: { text: string; y: number; fontSize: number }[];
  width?: number;
  height?: number;
  materialColor?: string;
  letteringColor?: string;
  hideOverlay?: boolean;
}

const VisualProof: React.FC<VisualProofProps> = ({ 
  id = "vector-proof-svg",
  shape, 
  lines, 
  width = 320, 
  height = 400,
  materialColor = "#262626", 
  letteringColor = "#e2b13c",
  hideOverlay = false
}) => {
  
  // Normalized shape paths that fit within the SVG viewBox without hitting edges
  const getShapePath = () => {
    const w = 400; // Viewbox standard width
    const h = 500; // Viewbox standard height
    const margin = 20;

    // For kerb-sets, the "shape" path is often the headstone portion.
    switch (shape) {
      case 'ogee':
        return `M ${margin} 380 L ${margin} 120 C ${margin} 80, 100 80, 120 60 C 160 30, 240 30, 280 60 C 300 80, ${w-margin} 80, ${w-margin} 120 L ${w-margin} 380 Z`;
      case 'half-round':
        return `M ${margin} 380 L ${margin} 180 A 180 180 0 0 1 ${w-margin} 180 L ${w-margin} 380 Z`;
      case 'heart':
        return `M 200 380 C 100 350, ${margin} 280, ${margin} 180 A 85 85 0 0 1 200 180 A 85 85 0 0 1 ${w-margin} 180 C ${w-margin} 280, 300 350, 200 380 Z`;
      case 'kerb-set':
        // Headstone for the kerb set
        return `M 100 350 L 100 80 C 100 60, 140 40, 200 40 C 260 40, 300 60, 300 80 L 300 350 Z`;
      case 'square':
      default:
        return `M ${margin} 380 L ${margin} ${margin} L ${w-margin} ${margin} L ${w-margin} 380 Z`;
    }
  };

  return (
    <div className={`relative inline-block bg-slate-200/50 p-6 rounded-[2.5rem] border border-slate-200 shadow-inner overflow-hidden flex items-center justify-center`}>
      <svg 
        id={id}
        width={width} 
        height={height} 
        viewBox="0 0 400 500" 
        className="drop-shadow-2xl overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Stone shadow */}
        {!hideOverlay && <path d={getShapePath()} fill="rgba(0,0,0,0.15)" transform="translate(8, 8)" />}
        
        {/* Kerb Surround (If applicable) */}
        {shape === 'kerb-set' && (
          <g id="kerbs">
            {/* Back Kerb */}
            <rect x="50" y="340" width="300" height="40" fill={materialColor} stroke="#000" strokeWidth="1" />
            {/* Left Kerb */}
            <path d="M 50 380 L 10 480 L 60 480 L 90 380 Z" fill={materialColor} stroke="#000" strokeWidth="1" />
            {/* Right Kerb */}
            <path d="M 350 380 L 390 480 L 340 480 L 310 380 Z" fill={materialColor} stroke="#000" strokeWidth="1" />
            {/* Front Kerb */}
            <rect x="50" y="460" width="300" height="20" fill={materialColor} stroke="#000" strokeWidth="1" />
            {/* Grave center / Chippings */}
            <rect x="90" y="380" width="220" height="80" fill="#e5e7eb" opacity="0.6" />
          </g>
        )}

        {/* Stone Body */}
        <path id="stone-outline" d={getShapePath()} fill={materialColor} stroke="#000" strokeWidth="1" />
        
        {/* Polish Gradient */}
        {!hideOverlay && <path d={getShapePath()} fill="url(#stoneGradient)" opacity="0.3" />}

        {/* Lettering Group */}
        <g id="inscription-group" textAnchor="middle" style={{ fontFamily: "serif", fontWeight: 700 }}>
          {lines.map((line, idx) => (
            <text 
              key={idx} 
              x={shape === 'kerb-set' ? "200" : "200"} 
              y={line.y} 
              fontSize={line.fontSize} 
              fill={letteringColor}
              className="tracking-wider select-none pointer-events-none"
              style={{ filter: hideOverlay ? 'none' : 'drop-shadow(0px 1px 1px rgba(0,0,0,0.6))' }}
            >
              {line.text.toUpperCase()}
            </text>
          ))}
        </g>

        <defs>
          <linearGradient id="stoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'white', stopOpacity: 0.2 }} />
            <stop offset="50%" style={{ stopColor: 'white', stopOpacity: 0 }} />
            <stop offset="100%" style={{ stopColor: 'black', stopOpacity: 0.4 }} />
          </linearGradient>
        </defs>
      </svg>
      
      {!hideOverlay && (
        <div className="absolute top-3 left-3 flex gap-2">
           <div className="px-2 py-0.5 bg-white/90 backdrop-blur rounded-full text-[7px] font-black uppercase tracking-widest text-slate-500 border border-slate-200">
             {shape} Preview
           </div>
        </div>
      )}
    </div>
  );
};

export default VisualProof;
