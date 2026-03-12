import React, { useMemo } from "react";
import { TentGender } from "@/types/village";

type TentType = "SIMPLE" | "DOUBLE" | "WHITE";
type CleaningState = "CLEAN" | "DIRTY" | "IN_PROGRESS";

export type TentNode = {
  id: string;
  code: string;
  type: TentType;
  cleaning: CleaningState;
  occupancySummary: { used: number; total: number };
  onClick: () => void;
  isAlef?: boolean;
  doubleTentId?: string;
  gender?: TentGender;
  hasReservation?: boolean; // Whether tent has active reservation (group name or dates)
  hasExtraBed?: boolean; // Whether tent has +1 extra bed from VIP config
};

// Gender-based colors for tent fill - only when tent has reservation
function genderColor(gender?: TentGender, hasReservation?: boolean): string {
  if (!hasReservation) return "hsl(40, 30%, 96%)";
  switch (gender) {
    case 'FEMALE': return "hsl(147, 69%, 40%)";
    case 'MALE': return "hsl(228, 90%, 44%)";
    case 'MIXED': return "hsl(17, 99%, 53%)";
    default: return "hsl(40, 30%, 96%)";
  }
}

function genderStroke(gender?: TentGender, hasReservation?: boolean): string {
  if (!hasReservation) return "hsl(30, 10%, 50%)";
  switch (gender) {
    case 'FEMALE': return "hsl(147, 69%, 30%)";
    case 'MALE': return "hsl(228, 90%, 34%)";
    case 'MIXED': return "hsl(17, 99%, 43%)";
    default: return "hsl(30, 10%, 50%)";
  }
}

function TentIcon({ x, y, type, fill, stroke, label }: { x: number; y: number; type: TentType; fill: string; stroke: string; label: string }) {
  if (type === "WHITE") {
    return (
      <g transform={`translate(${x},${y})`}>
        <ellipse cx="0" cy="0" rx="26" ry="18" fill={fill} stroke={stroke} strokeWidth="2" />
        <text x="0" y="5" textAnchor="middle" fontSize="11" fontWeight="600" fill="hsl(30, 20%, 25%)">{label}</text>
      </g>
    );
  }

  // For DOUBLE type, we render a single triangle but with smaller size to fit paired layout
  if (type === "DOUBLE") {
    return (
      <g transform={`translate(${x},${y})`}>
        <polygon points="-22,12 0,-16 22,12" fill={fill} stroke={stroke} strokeWidth="2" />
        <text x="0" y="6" textAnchor="middle" fontSize="9" fontWeight="600" fill="hsl(30, 20%, 25%)">{label}</text>
      </g>
    );
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <polygon points="-26,14 0,-22 26,14" fill={fill} stroke={stroke} strokeWidth="2" />
      <text x="0" y="6" textAnchor="middle" fontSize="10" fontWeight="600" fill="hsl(30, 20%, 25%)">{label}</text>
    </g>
  );
}

// Double tent pair component - shows Alef and Bet side by side
function DoubleTentPair({ 
  x, y, 
  alefNode, 
  betNode,
  pairLabel 
}: { 
  x: number; 
  y: number; 
  alefNode: TentNode;
  betNode: TentNode;
  pairLabel: string;
}) {
  const alefFill = genderColor(alefNode.gender, alefNode.hasReservation);
  const alefStroke = genderStroke(alefNode.gender, alefNode.hasReservation);
  const betFill = genderColor(betNode.gender, betNode.hasReservation);
  const betStroke = genderStroke(betNode.gender, betNode.hasReservation);

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Pair label above */}
      <text x="0" y="-28" textAnchor="middle" fontSize="12" fontWeight="bold" fill="hsl(30, 20%, 25%)">{pairLabel}</text>
      
      {/* Alef tent on left */}
      <g onClick={alefNode.onClick} style={{ cursor: "pointer" }} className="hover:opacity-80 transition-opacity">
        <polygon points="-45,18 -23,-12 -1,18" fill={alefFill} stroke={alefStroke} strokeWidth="2" />
        <text x="-23" y="10" textAnchor="middle" fontSize="8" fontWeight="600" fill="hsl(30, 20%, 25%)">א</text>
      </g>
      
      {/* Bet tent on right */}
      <g onClick={betNode.onClick} style={{ cursor: "pointer" }} className="hover:opacity-80 transition-opacity">
        <polygon points="1,18 23,-12 45,18" fill={betFill} stroke={betStroke} strokeWidth="2" />
        <text x="23" y="10" textAnchor="middle" fontSize="8" fontWeight="600" fill="hsl(30, 20%, 25%)">ב</text>
      </g>
    </g>
  );
}

export default function NeighborhoodMap({ title, nodes, isDoubleTentNeighborhood }: { 
  title: string; 
  nodes: TentNode[];
  isDoubleTentNeighborhood?: boolean;
}) {
  const size = 650;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 220;

  // Group nodes by double tent pairs for N1, N2, N3
  const { pairs, singles } = useMemo(() => {
    if (!isDoubleTentNeighborhood) {
      return { pairs: [], singles: nodes };
    }

    const pairMap = new Map<string, { alef?: TentNode; bet?: TentNode }>();
    const singleNodes: TentNode[] = [];

    nodes.forEach(node => {
      if (node.doubleTentId) {
        const existing = pairMap.get(node.doubleTentId) || {};
        if (node.isAlef) {
          existing.alef = node;
        } else {
          existing.bet = node;
        }
        pairMap.set(node.doubleTentId, existing);
      } else {
        singleNodes.push(node);
      }
    });

    // Sort pairs by their numeric code (e.g., double_12, double_13, etc.)
    const sortedPairs = Array.from(pairMap.entries())
      .sort((a, b) => {
        const numA = parseInt(a[0].replace('double_', ''));
        const numB = parseInt(b[0].replace('double_', ''));
        return numA - numB;
      })
      .map(([id, pair]) => ({ id, ...pair }));

    return { pairs: sortedPairs, singles: singleNodes };
  }, [nodes, isDoubleTentNeighborhood]);

  // Calculate positions for double tent pairs (clockwise from top)
  const pairPositions = useMemo(() => {
    if (pairs.length === 0) return [];
    
    return pairs.map((pair, i) => {
      // Start from top (-PI/2) and go clockwise
      const angle = (2 * Math.PI * i) / pairs.length - Math.PI / 2;
      return {
        pair,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        pairLabel: pair.id.replace('double_', ''),
      };
    });
  }, [pairs, cx, cy, radius]);

  // Calculate positions for single tents (for N4, N5, N6, N7)
  const singlePositions = useMemo(() => {
    if (singles.length === 0) return [];
    
    // Sort singles by their code number
    const sorted = [...singles].sort((a, b) => {
      const numA = parseInt(a.code.replace(/\D/g, ''));
      const numB = parseInt(b.code.replace(/\D/g, ''));
      return numA - numB;
    });

    return sorted.map((node, i) => {
      const angle = (2 * Math.PI * i) / sorted.length - Math.PI / 2;
      return {
        node,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
  }, [singles, cx, cy, radius]);

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold text-foreground mb-4">{title}</h2>
      <svg width={size} height={size} className="max-w-full" viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={280} fill="hsl(40, 30%, 96%)" />
        
        {/* Connection lines for pairs */}
        {pairPositions.map(({ pair, x, y }) => (
          <line key={`line-${pair.id}`} x1={cx} y1={cy} x2={x} y2={y} stroke="hsl(40, 20%, 85%)" strokeWidth="1" />
        ))}
        
        {/* Connection lines for singles */}
        {singlePositions.map(({ node, x, y }) => (
          <line key={`line-${node.id}`} x1={cx} y1={cy} x2={x} y2={y} stroke="hsl(40, 20%, 85%)" strokeWidth="1" />
        ))}
        
        {/* Center marker */}
        <circle cx={cx} cy={cy} r={30} fill="hsl(36, 90%, 55%)" />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">CENTER</text>
        
        {/* Double tent pairs */}
        {pairPositions.map(({ pair, x, y, pairLabel }) => (
          pair.alef && pair.bet && (
            <DoubleTentPair
              key={pair.id}
              x={x}
              y={y}
              alefNode={pair.alef}
              betNode={pair.bet}
              pairLabel={pairLabel}
            />
          )
        ))}
        
        {/* Single tent icons */}
        {singlePositions.map(({ node, x, y }) => (
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
              fill={genderColor(node.gender, node.hasReservation)} 
              stroke={genderStroke(node.gender, node.hasReservation)}
              label={node.code} 
            />
          </g>
        ))}
      </svg>
      
      {/* Gender Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(40, 30%, 96%)" }} />
          <span>לא משובץ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(147, 69%, 40%)" }} />
          <span>נשים</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(228, 90%, 44%)" }} />
          <span>גברים</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(17, 99%, 53%)" }} />
          <span>מעורב</span>
        </div>
      </div>
    </div>
  );
}