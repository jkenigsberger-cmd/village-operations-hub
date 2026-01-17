import React from 'react';
import { useVillage } from '@/context/VillageContext';
import { NeighborhoodTile } from '@/components/NeighborhoodTile';
import { NeighborhoodId } from '@/types/village';
import { Map } from 'lucide-react';

const neighborhoodOrder: NeighborhoodId[] = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'VIP'];

const Neighborhoods: React.FC = () => {
  const { state, getNeighborhoodSummary } = useVillage();

  if (!state) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Map className="w-7 h-7" />
          All Neighborhoods
        </h1>
        <p className="text-muted-foreground">
          Click on a neighborhood to view details and manage tents
        </p>
      </div>

      {/* Neighborhood Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {neighborhoodOrder.map((id) => {
          const summary = getNeighborhoodSummary(id);
          if (!summary) return null;
          return (
            <NeighborhoodTile
              key={id}
              summary={summary}
              to={`/neighborhood/${id}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Neighborhoods;
