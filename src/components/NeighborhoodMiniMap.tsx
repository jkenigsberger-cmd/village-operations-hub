import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NeighborhoodId, NeighborhoodSummary, Tent, TentGender } from "@/types/village";
import { getBookingStatus } from "@/lib/bookingStatusColors";
import { format } from "date-fns";
import MiniMapCircular, { MiniTentNode } from "./MiniMapCircular";
import MiniMapVIP, { MiniVIPTentNode } from "./MiniMapVIP";
import { Users, LogIn, LogOut } from "lucide-react";

interface NeighborhoodMiniMapProps {
  neighborhoodId: NeighborhoodId;
  displayName: string;
  tents: Tent[];
  summary: NeighborhoodSummary;
  onTentClick: (tentId: string) => void;
}

function getTentType(tent: Tent): "SIMPLE" | "DOUBLE" | "WHITE" {
  if (tent.neighborhoodId === 'N5' || tent.neighborhoodId === 'N6') return "WHITE";
  if (tent.neighborhoodId === 'N1' || tent.neighborhoodId === 'N2' || tent.neighborhoodId === 'N3') return "DOUBLE";
  return "SIMPLE";
}

export default function NeighborhoodMiniMap({ 
  neighborhoodId, 
  displayName, 
  tents, 
  summary,
  onTentClick 
}: NeighborhoodMiniMapProps) {
  const navigate = useNavigate();
  const isVIP = neighborhoodId === 'VIP';
  const isDoubleTentNeighborhood = ['N1', 'N2', 'N3'].includes(neighborhoodId);

  const handleMapClick = () => {
    navigate(`/neighborhood/${neighborhoodId}`);
  };

  const circularNodes: MiniTentNode[] = useMemo(() => {
    if (isVIP) return [];
    
    return tents.map(tent => ({
      id: tent.id,
      code: tent.code,
      type: getTentType(tent),
      onClick: () => onTentClick(tent.id),
      isAlef: tent.isAlef,
      doubleTentId: tent.doubleTentId,
      gender: tent.gender,
      hasReservation: (() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return !!(tent.checkInDate && tent.checkOutDate && getBookingStatus(tent.checkInDate, tent.checkOutDate, today));
      })(),
    }));
  }, [tents, isVIP, onTentClick]);

  const vipNodes: MiniVIPTentNode[] = useMemo(() => {
    if (!isVIP) return [];
    
    return tents.map(tent => ({
      id: tent.id,
      code: tent.code,
      onClick: () => onTentClick(tent.id),
      gender: tent.gender,
      hasReservation: (() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return !!(tent.checkInDate && tent.checkOutDate && getBookingStatus(tent.checkInDate, tent.checkOutDate, today));
      })(),
    }));
  }, [tents, isVIP, onTentClick]);

  const occupancyPercent = summary.totalBeds > 0 
    ? Math.round((summary.occupiedBeds / summary.totalBeds) * 100) 
    : 0;

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${isVIP ? 'border-amber-400 border-2' : ''}`}>
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <span className={isVIP ? 'text-amber-600' : ''}>
            {isVIP && '⭐ '}{displayName}
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {summary.occupiedBeds}/{summary.totalBeds}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <div className="flex justify-center">
          {isVIP ? (
            <MiniMapVIP nodes={vipNodes} onMapClick={handleMapClick} />
          ) : (
            <MiniMapCircular 
              nodes={circularNodes} 
              isDoubleTentNeighborhood={isDoubleTentNeighborhood}
              onMapClick={handleMapClick}
            />
          )}
        </div>
        
        {/* Summary bar */}
        <div className="mt-2 space-y-1">
          {/* Occupancy bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
          
          {/* Quick stats */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{occupancyPercent}%</span>
            </div>
            {(summary.checkInsToday > 0 || summary.checkOutsToday > 0) && (
              <div className="flex items-center gap-2">
                {summary.checkInsToday > 0 && (
                  <span className="flex items-center gap-0.5 text-green-600">
                    <LogIn className="h-3 w-3" />
                    {summary.checkInsToday}
                  </span>
                )}
                {summary.checkOutsToday > 0 && (
                  <span className="flex items-center gap-0.5 text-blue-600">
                    <LogOut className="h-3 w-3" />
                    {summary.checkOutsToday}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
