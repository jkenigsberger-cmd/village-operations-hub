import React from "react";
import { TentNode } from "./NeighborhoodMap";
import { TentGender } from "@/types/village";

// Gender-based colors for tent fill - only when tent has reservation
function genderColor(gender?: TentGender, hasReservation?: boolean): string {
  // Only show gender colors if there's an active reservation
  if (!hasReservation) return "hsl(40, 30%, 96%)"; // Default/neutral
  
  switch (gender) {
    case 'FEMALE': return "hsl(330, 70%, 75%)"; // Pink
    case 'MALE': return "hsl(210, 70%, 65%)"; // Blue
    case 'MIXED': return "hsl(270, 60%, 70%)"; // Purple
    default: return "hsl(40, 30%, 96%)"; // Default/empty
  }
}

function genderStroke(gender?: TentGender, hasReservation?: boolean): string {
  // Only show gender stroke if there's an active reservation
  if (!hasReservation) return "hsl(30, 10%, 50%)";
  
  switch (gender) {
    case 'FEMALE': return "hsl(330, 60%, 50%)";
    case 'MALE': return "hsl(210, 60%, 45%)";
    case 'MIXED': return "hsl(270, 50%, 50%)";
    default: return "hsl(30, 10%, 50%)";
  }
}

function VIPTentIcon({ x, y, fill, stroke, label }: { x: number; y: number; fill: string; stroke: string; label: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {/* VIP tent - premium rectangular cabin style */}
      <rect 
        x="-28" 
        y="-18" 
        width="56" 
        height="36" 
        rx="4" 
        fill={fill} 
        stroke={stroke} 
        strokeWidth="2.5" 
      />
      {/* Roof */}
      <polygon 
        points="-32,-18 0,-32 32,-18" 
        fill={fill} 
        stroke={stroke} 
        strokeWidth="2.5" 
      />
      {/* Door */}
      <rect 
        x="-6" 
        y="2" 
        width="12" 
        height="16" 
        rx="1" 
        fill="hsl(30, 20%, 40%)" 
      />
      <text 
        x="0" 
        y="46" 
        textAnchor="middle" 
        fontSize="13" 
        fontWeight="700" 
        fill="hsl(30, 20%, 25%)"
      >
        {label}
      </text>
    </g>
  );
}

// VIP Layout positions based on the exact requirements:
// [ 88 ] [ 89 ] [ 80 ] [ 81 ]
//         [ Fireplace ]
// [ 87 ]                 [ 82 ]
// [ 86 ] [ 85 ] [ 84 ] [ 83 ]
const VIP_POSITIONS: Record<string, { x: number; y: number }> = {
  // Top row (left to right): 88, 89, 80, 81
  "88": { x: 90, y: 60 },
  "89": { x: 230, y: 60 },
  "80": { x: 370, y: 60 },
  "81": { x: 510, y: 60 },
  
  // Middle row: 87 (left), 82 (right)
  "87": { x: 90, y: 180 },
  "82": { x: 510, y: 180 },
  
  // Bottom row (left to right): 86, 85, 84, 83
  "86": { x: 90, y: 300 },
  "85": { x: 230, y: 300 },
  "84": { x: 370, y: 300 },
  "83": { x: 510, y: 300 },
};

function extractTentNumber(code: string): string {
  // Extract tent number from codes like "VIP 87" -> "87"
  const match = code.match(/\d+/);
  return match ? match[0] : code;
}

export default function VIPNeighborhoodMap({ nodes }: { nodes: TentNode[] }) {
  const width = 600;
  const height = 380;
  const fireplaceCx = width / 2;
  const fireplaceCy = height / 2;

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold text-foreground mb-4">VIP Neighborhood</h2>
      
      {/* Gender Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(40, 30%, 96%)" }} />
          <span>לא משובץ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(330, 70%, 75%)" }} />
          <span>♀ נקבה</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(210, 70%, 65%)" }} />
          <span>♂ זכר</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(270, 60%, 70%)" }} />
          <span>מעורב</span>
        </div>
      </div>

      <svg 
        width={width} 
        height={height} 
        className="max-w-full" 
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* Background rectangle */}
        <rect 
          x="20" 
          y="20" 
          width={width - 40} 
          height={height - 40} 
          rx="16" 
          fill="hsl(40, 30%, 96%)" 
          stroke="hsl(40, 20%, 85%)" 
          strokeWidth="2"
        />
        
        {/* Fireplace in center */}
        <circle 
          cx={fireplaceCx} 
          cy={fireplaceCy} 
          r={35} 
          fill="hsl(15, 70%, 45%)" 
          stroke="hsl(15, 60%, 35%)" 
          strokeWidth="3"
        />
        {/* Fireplace inner glow */}
        <circle 
          cx={fireplaceCx} 
          cy={fireplaceCy} 
          r={20} 
          fill="hsl(30, 90%, 55%)" 
        />
        {/* Fireplace flames */}
        <path 
          d={`M${fireplaceCx - 8},${fireplaceCy + 5} Q${fireplaceCx - 4},${fireplaceCy - 12} ${fireplaceCx},${fireplaceCy + 2} Q${fireplaceCx + 4},${fireplaceCy - 12} ${fireplaceCx + 8},${fireplaceCy + 5}`}
          fill="hsl(40, 95%, 60%)"
        />
        <text 
          x={fireplaceCx} 
          y={fireplaceCy + 55} 
          textAnchor="middle" 
          fontSize="12" 
          fontWeight="600" 
          fill="hsl(30, 20%, 40%)"
        >
          Fireplace
        </text>

        {/* Connection lines from fireplace to tents */}
        {nodes.map((node) => {
          const tentNum = extractTentNumber(node.code);
          const pos = VIP_POSITIONS[tentNum];
          if (!pos) return null;
          
          return (
            <line 
              key={`line-${node.id}`}
              x1={fireplaceCx} 
              y1={fireplaceCy} 
              x2={pos.x} 
              y2={pos.y} 
              stroke="hsl(40, 20%, 85%)" 
              strokeWidth="1" 
              strokeDasharray="4,4"
            />
          );
        })}
        
        {/* VIP tent icons */}
        {nodes.map((node) => {
          const tentNum = extractTentNumber(node.code);
          const pos = VIP_POSITIONS[tentNum];
          if (!pos) return null;

          // Use hasReservation from node (synced with Neighborhood.tsx)
          const fill = genderColor(node.gender, node.hasReservation);
          const stroke = genderStroke(node.gender, node.hasReservation);
          
          return (
            <g 
              key={node.id} 
              onClick={node.onClick} 
              style={{ cursor: "pointer" }}
              className="hover:opacity-80 transition-opacity"
            >
              <VIPTentIcon 
                x={pos.x} 
                y={pos.y} 
                fill={fill} 
                stroke={stroke}
                label={node.code} 
              />
              {node.hasExtraBed && (
                <g transform={`translate(${pos.x + 22},${pos.y - 30})`}>
                  <circle r="11" fill="hsl(25, 90%, 50%)" stroke="white" strokeWidth="1.5" />
                  <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="800" fill="white">+1</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
