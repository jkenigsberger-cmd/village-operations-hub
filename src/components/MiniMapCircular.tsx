import React, { useMemo } from "react";
import { TentGender } from "@/types/village";
import { genderColor, genderStroke } from "@/lib/tentColors";

type TentType = "SIMPLE" | "DOUBLE" | "WHITE";

export type MiniTentNode = {
  id: string;
  code: string;
  type: TentType;
  onClick: () => void;
  isAlef?: boolean;
  doubleTentId?: string;
  gender?: TentGender;
  hasReservation?: boolean;
};

function MiniTentIcon({ x, y, type, fill, stroke, label }: { 
  x: number; y: number; type: TentType; fill: string; stroke: string; label: string 
}) {
  if (type === "WHITE") {
    return (
      <g transform={`translate(${x},${y})`}>
        <ellipse cx="0" cy="0" rx="14" ry="10" fill={fill} stroke={stroke} strokeWidth="1.5" />
        <text x="0" y="3" textAnchor="middle" fontSize="6" fontWeight="600" fill="hsl(30, 20%, 25%)">{label}</text>
      </g>
    );
  }

  if (type === "DOUBLE") {
    return (
      <g transform={`translate(${x},${y})`}>
        <polygon points="-12,7 0,-9 12,7" fill={fill} stroke={stroke} strokeWidth="1.5" />
        <text x="0" y="4" textAnchor="middle" fontSize="5" fontWeight="600" fill="hsl(30, 20%, 25%)">{label}</text>
      </g>
    );
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <polygon points="-14,8 0,-12 14,8" fill={fill} stroke={stroke} strokeWidth="1.5" />
      <text x="0" y="4" textAnchor="middle" fontSize="6" fontWeight="600" fill="hsl(30, 20%, 25%)">{label}</text>
    </g>
  );
}

function MiniDoubleTentPair({ 
  x, y, 
  alefNode, 
  betNode,
  pairLabel 
}: { 
  x: number; y: number; 
  alefNode: MiniTentNode;
  betNode: MiniTentNode;
  pairLabel: string;
}) {
  const alefFill = genderColor(alefNode.gender, alefNode.hasReservation);
  const alefStroke = genderStroke(alefNode.gender, alefNode.hasReservation);
  const betFill = genderColor(betNode.gender, betNode.hasReservation);
  const betStroke = genderStroke(betNode.gender, betNode.hasReservation);

  return (
    <g transform={`translate(${x},${y})`}>
      <text x="0" y="-14" textAnchor="middle" fontSize="7" fontWeight="bold" fill="hsl(30, 20%, 25%)">{pairLabel}</text>
      
      <g onClick={alefNode.onClick} style={{ cursor: "pointer" }} className="hover:opacity-80 transition-opacity">
        <polygon points="-22,9 -11,-7 0,9" fill={alefFill} stroke={alefStroke} strokeWidth="1.5" />
        <text x="-11" y="5" textAnchor="middle" fontSize="5" fontWeight="600" fill="hsl(30, 20%, 25%)">א</text>
      </g>
      
      <g onClick={betNode.onClick} style={{ cursor: "pointer" }} className="hover:opacity-80 transition-opacity">
        <polygon points="0,9 11,-7 22,9" fill={betFill} stroke={betStroke} strokeWidth="1.5" />
        <text x="11" y="5" textAnchor="middle" fontSize="5" fontWeight="600" fill="hsl(30, 20%, 25%)">ב</text>
      </g>
    </g>
  );
}

interface MiniMapCircularProps {
  nodes: MiniTentNode[];
  isDoubleTentNeighborhood?: boolean;
  onMapClick?: () => void;
}

export default function MiniMapCircular({ nodes, isDoubleTentNeighborhood, onMapClick }: MiniMapCircularProps) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 65;

  const { pairs, singles } = useMemo(() => {
    if (!isDoubleTentNeighborhood) {
      return { pairs: [], singles: nodes };
    }

    const pairMap = new Map<string, { alef?: MiniTentNode; bet?: MiniTentNode }>();
    const singleNodes: MiniTentNode[] = [];

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

    const sortedPairs = Array.from(pairMap.entries())
      .sort((a, b) => {
        const numA = parseInt(a[0].replace('double_', ''));
        const numB = parseInt(b[0].replace('double_', ''));
        return numA - numB;
      })
      .map(([id, pair]) => ({ id, ...pair }));

    return { pairs: sortedPairs, singles: singleNodes };
  }, [nodes, isDoubleTentNeighborhood]);

  const pairPositions = useMemo(() => {
    if (pairs.length === 0) return [];
    
    return pairs.map((pair, i) => {
      const angle = (2 * Math.PI * i) / pairs.length - Math.PI / 2;
      return {
        pair,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        pairLabel: pair.id.replace('double_', ''),
      };
    });
  }, [pairs, cx, cy, radius]);

  const singlePositions = useMemo(() => {
    if (singles.length === 0) return [];
    
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
    <svg 
      width={size} 
      height={size} 
      className="max-w-full cursor-pointer" 
      viewBox={`0 0 ${size} ${size}`}
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target as SVGElement).tagName === 'circle') {
          onMapClick?.();
        }
      }}
    >
      <circle cx={cx} cy={cy} r={85} fill="hsl(40, 30%, 96%)" />
      
      {pairPositions.map(({ pair, x, y }) => (
        <line key={`line-${pair.id}`} x1={cx} y1={cy} x2={x} y2={y} stroke="hsl(40, 20%, 85%)" strokeWidth="0.5" />
      ))}
      
      {singlePositions.map(({ node, x, y }) => (
        <line key={`line-${node.id}`} x1={cx} y1={cy} x2={x} y2={y} stroke="hsl(40, 20%, 85%)" strokeWidth="0.5" />
      ))}
      
      <circle cx={cx} cy={cy} r={12} fill="hsl(36, 90%, 55%)" />
      
      {pairPositions.map(({ pair, x, y, pairLabel }) => (
        pair.alef && pair.bet && (
          <MiniDoubleTentPair
            key={pair.id}
            x={x}
            y={y}
            alefNode={pair.alef}
            betNode={pair.bet}
            pairLabel={pairLabel}
          />
        )
      ))}
      
      {singlePositions.map(({ node, x, y }) => (
        <g 
          key={node.id} 
          onClick={(e) => { e.stopPropagation(); node.onClick(); }}
          style={{ cursor: "pointer" }}
          className="hover:opacity-80 transition-opacity"
        >
          <MiniTentIcon 
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
  );
}
