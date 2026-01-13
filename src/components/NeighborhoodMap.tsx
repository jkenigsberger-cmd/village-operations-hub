import React, { useMemo } from "react";

type TentType = "SIMPLE" | "DOUBLE" | "WHITE";
type CleaningState = "CLEAN" | "DIRTY" | "IN_PROGRESS";

export type TentNode = {
  id: string;
  code: string;
  type: TentType;
  cleaning: CleaningState;
  occupancySummary: { used: number; total: number };
  onClick: () => void;
};

function statusColor(cleaning: CleaningState, used: number, total: number) {
  if (cleaning === "DIRTY") return "hsl(30, 35%, 35%)";
  if (cleaning === "IN_PROGRESS") return "hsl(40, 30%, 75%)";
  const ratio = total ? used / total : 0;
  if (ratio >= 0.95) return "hsl(80, 30%, 37%)";
  if (ratio > 0) return "hsl(90, 25%, 62%)";
  return "hsl(40, 30%, 96%)";
}

function TentIcon({ x, y, type, fill, label }: { x: number; y: number; type: TentType; fill: string; label: string }) {
  if (type === "WHITE") {
    return (
      <g transform={`translate(${x},${y})`}>
        <ellipse cx="0" cy="0" rx="26" ry="18" fill={fill} stroke="hsl(30, 10%, 50%)" strokeWidth="1.5" />
        <text x="0" y="35" textAnchor="middle" fontSize="12" fontWeight="600" fill="hsl(30, 20%, 25%)">{label}</text>
      </g>
    );
  }

  if (type === "DOUBLE") {
    return (
      <g transform={`translate(${x},${y})`}>
        <polygon points="-28,12 -10,-18 8,12" fill={fill} stroke="hsl(30, 10%, 50%)" strokeWidth="1.5" />
        <polygon points="-2,12 16,-18 34,12" fill={fill} stroke="hsl(30, 10%, 50%)" strokeWidth="1.5" />
        <text x="3" y="35" textAnchor="middle" fontSize="12" fontWeight="600" fill="hsl(30, 20%, 25%)">{label}</text>
      </g>
    );
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <polygon points="-26,14 0,-22 26,14" fill={fill} stroke="hsl(30, 10%, 50%)" strokeWidth="1.5" />
      <text x="0" y="35" textAnchor="middle" fontSize="12" fontWeight="600" fill="hsl(30, 20%, 25%)">{label}</text>
    </g>
  );
}

export default function NeighborhoodMap({ title, nodes }: { title: string; nodes: TentNode[] }) {
  const size = 650;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 230;

  const positions = useMemo(() => {
    return nodes.map((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      return {
        node,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
  }, [nodes, cx, cy, radius]);

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold text-foreground mb-4">{title}</h2>
      <svg width={size} height={size} className="max-w-full" viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={280} fill="hsl(40, 30%, 96%)" />
        
        {/* Connection lines */}
        {positions.map(({ node, x, y }) => (
          <line key={`line-${node.id}`} x1={cx} y1={cy} x2={x} y2={y} stroke="hsl(40, 20%, 85%)" strokeWidth="1" />
        ))}
        
        {/* Center marker */}
        <circle cx={cx} cy={cy} r={30} fill="hsl(36, 90%, 55%)" />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">CENTER</text>
        
        {/* Tent icons */}
        {positions.map(({ node, x, y }) => (
          <g 
            key={node.id} 
            onClick={node.onClick} 
            style={{ cursor: "pointer" }}
            className="hover:opacity-80 transition-opacity"
          >
            <TentIcon 
              x={x} 
              y={y} 
              type={node.type} 
              fill={statusColor(node.cleaning, node.occupancySummary.used, node.occupancySummary.total)} 
              label={node.code} 
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
