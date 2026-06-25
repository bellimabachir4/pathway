import React from "react";

interface PathwayLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function PathwayLogo({ className = "", size = "md" }: PathwayLogoProps) {
  // Dimensions mapping
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  return (
    <div 
      className={`rounded-full bg-white border border-slate-200/85 p-1 flex items-center justify-center shadow-sm select-none shrink-0 ${sizeClasses[size]} ${className}`}
      id="pathway-circular-logo-container"
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full object-contain"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Globe Grid (Orange #f2591f) */}
        <circle 
          cx="102" 
          cy="96" 
          r="30" 
          fill="none" 
          stroke="#f2591f" 
          strokeWidth="2" 
        />
        {/* Longitude grid curves */}
        <path 
          d="M 84,73 C 94,80 94,112 84,119" 
          fill="none" 
          stroke="#f2591f" 
          strokeWidth="1.5" 
        />
        <path 
          d="M 120,73 C 110,80 110,112 120,119" 
          fill="none" 
          stroke="#f2591f" 
          strokeWidth="1.5" 
        />
        {/* Latitude grid curves */}
        <path 
          d="M 75,86 C 85,91 119,91 129,86" 
          fill="none" 
          stroke="#f2591f" 
          strokeWidth="1.5" 
        />
        <path 
          d="M 75,106 C 85,101 119,101 129,106" 
          fill="none" 
          stroke="#f2591f" 
          strokeWidth="1.5" 
        />
        {/* Grid axes */}
        <line x1="102" y1="66" x2="102" y2="126" stroke="#f2591f" strokeWidth="1.5" />
        <line x1="72" y1="96" x2="132" y2="96" stroke="#f2591f" strokeWidth="1.5" />

        {/* Graduation Cap (Blue #003B95) */}
        {/* Top diamond */}
        <path 
          d="M 44,52 L 68,34 L 92,52 L 68,66 Z" 
          fill="#003B95" 
        />
        {/* Under cap base */}
        <path 
          d="M 54,58 L 54,65 C 54,69 82,69 82,65 L 82,58 Z" 
          fill="#003B95" 
        />
        {/* Tassel */}
        <path 
          d="M 52,52 L 52,72" 
          stroke="#003B95" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
        />
        <polygon 
          points="50,72 54,72 54,80 50,80" 
          fill="#003B95" 
        />

        {/* S-Pathway ribbon swirl (Blue #003B95) */}
        {/* Thick curved paths representing the double ribbons */}
        <path 
          d="M 108,52 C 128,52 138,64 136,78 C 133,96 109,114 89,122 C 73,128 64,124 64,116 C 64,106 78,92 90,88" 
          fill="none" 
          stroke="#003B95" 
          strokeWidth="4.5" 
          strokeLinecap="round" 
        />
        <path 
          d="M 94,140 C 74,140 62,128 65,114 C 68,96 92,78 112,70 C 128,64 137,68 137,76 C 137,86 123,100 111,104" 
          fill="none" 
          stroke="#003B95" 
          strokeWidth="4.5" 
          strokeLinecap="round" 
        />

        {/* Airplane (Blue #003B95) */}
        <path 
          d="M 140,84 L 144,80 L 148,80 L 154,75 L 152,73 L 149,74 L 146,69 L 148,67 L 153,68 L 159,61 C 161,59 163,60 163,62 L 160,69 L 162,74 L 160,76 L 155,73 L 152,78 L 153,81 L 149,83 L 144,86 Z" 
          fill="#003B95" 
        />

        {/* Text "ENGLISH PATHWAY" (Orange #f2591f) */}
        <text 
          x="102" 
          y="156" 
          textAnchor="middle" 
          fill="#f2591f" 
          fontSize="11.5" 
          fontWeight="900" 
          fontFamily="system-ui, -apple-system, sans-serif" 
          letterSpacing="0.2"
        >
          ENGLISH PATHWAY
        </text>

        {/* Open Book (Blue #003B95) */}
        <path 
          d="M 76,176 C 88,171 100,175 102,177 C 104,175 116,171 128,176 L 128,168 C 116,163 104,167 102,169 C 100,167 88,163 76,168 Z" 
          fill="#003B95" 
        />
        <line x1="102" y1="169" x2="102" y2="177" stroke="#003B95" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
