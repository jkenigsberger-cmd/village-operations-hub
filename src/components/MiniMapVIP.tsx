import React from "react";
import { TentGender } from "@/types/village";
import { genderColor, genderStroke } from "@/lib/tentColors";

export type MiniVIPTentNode = {
  id: string;
  code: string;
  onClick: () => void;
  gender?: TentGender;
  hasReservation?: boolean;
};

function MiniVIPTentIcon({ x, y, fill, stroke, label }: { 
  x: number; y: number; fill: string; stroke: string; label: string 
}) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-14" y="-9" width="28" height="18" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
      <polygon points="-16,-9 0,-16 16,-9" fill={fill} stroke={stroke} strokeWidth="1.5" />
      <rect x="-3" y="1" width="6" height="8" rx="0.5" fill="hsl(30, 20%, 40%)" />
      <text x="0" y="22" textAnchor="middle" fontSize="7" fontWeight="700" fill="hsl(30, 20%, 25%)">{label}</text>
    </g>
  );
}

const VIP_POSITIONS: Record<string, { x: number; y: number }> = {
  "88": { x: 35, y: 28 },
  "89": { x: 85, y: 28 },
  "80": { x: 135, y: 28 },
  "81": { x: 185, y: 28 },
  "87": { x: 35, y: 75 },
  "82": { x: 185, y: 75 },
  "86": { x: 35, y: 122 },
  "85": { x: 85, y: 122 },
  "84": { x: 135, y: 122 },
  "83": { x: 185, y: 122 },
};

function extractTentNumber(code: string): string {
  const match = code.match(/\d+/);
  return match ? match[0] : code;
}

interface MiniMapVIPProps {
  nodes: MiniVIPTentNode[];
  onMapClick?: () => void;
}

export default function MiniMapVIP({ nodes, onMapClick }: MiniMapVIPProps) {
  const width = 220;
  const height = 150;
  const fireplaceCx = width / 2;
  const fireplaceCy = height / 2;

  return (
    <svg 
      width={width} 
      height={height} 
      className="max-w-full cursor-pointer" 
      viewBox={`0 0 ${width} ${height}`}
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target as SVGElement).tagName === 'rect' || (e.target as SVGElement).tagName === 'circle') {
          onMapClick?.();
        }
      }}
    >
      <rect x="8" y="8" width={width - 16} height={height - 16} rx="8" fill="hsl(40, 30%, 96%)" stroke="hsl(40, 20%, 85%)" strokeWidth="1" />
      
      <circle cx={fireplaceCx} cy={fireplaceCy} r={14} fill="hsl(15, 70%, 45%)" stroke="hsl(15, 60%, 35%)" strokeWidth="2" />
      <circle cx={fireplaceCx} cy={fireplaceCy} r={8} fill="hsl(30, 90%, 55%)" />
      
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
            strokeWidth="0.5" 
            strokeDasharray="2,2"
          />
        );
      })}
      
      {nodes.map((node) => {
        const tentNum = extractTentNumber(node.code);
        const pos = VIP_POSITIONS[tentNum];
        if (!pos) return null;

        const fill = genderColor(node.gender, node.hasReservation);
        const stroke = genderStroke(node.gender, node.hasReservation);
        
        return (
          <g 
            key={node.id} 
            onClick={(e) => { e.stopPropagation(); node.onClick(); }}
            style={{ cursor: "pointer" }}
            className="hover:opacity-80 transition-opacity"
          >
            <MiniVIPTentIcon 
              x={pos.x} 
              y={pos.y} 
              fill={fill} 
              stroke={stroke}
              label={node.code} 
            />
          </g>
        );
      })}
    </svg>
  );
}
