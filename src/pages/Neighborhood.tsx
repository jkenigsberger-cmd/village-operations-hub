import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVillage } from '@/context/VillageContext';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { TentCard } from '@/components/TentCard';
import { NeighborhoodId } from '@/types/village';
import { 
  Search, 
  Filter, 
  Loader2,
  LayoutGrid,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'dirty' | 'checkin' | 'checkout' | 'full';

const Neighborhood = () => {
  const { id } = useParams<{ id: string }>();
  const { state, isLoading, getTentSummary } = useVillage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [groupByDouble, setGroupByDouble] = useState(false);

  const neighborhoodId = id as NeighborhoodId;

  const neighborhood = state?.neighborhoods[neighborhoodId];
  const hasDoubleTents = neighborhood?.hasDoubleTents;

  const today = new Date().toISOString().split('T')[0];

  const tentSummaries = useMemo(() => {
    if (!state || !neighborhood) return [];
    
    return neighborhood.tentIds
      .map(tentId => {
        const tent = state.tents[tentId];
        const summary = getTentSummary(tentId);
        return { tent, summary };
      })
      .filter(({ tent, summary }) => tent && summary)
      .map(({ tent, summary }) => ({ tent: tent!, summary: summary! }));
  }, [state, neighborhood, getTentSummary]);

  // Apply filters
  const filteredTents = useMemo(() => {
    let result = tentSummaries;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(({ tent, summary }) => 
        tent.code.toLowerCase().includes(query) ||
        (summary.groupName?.toLowerCase().includes(query))
      );
    }

    // Type filter
    switch (activeFilter) {
      case 'dirty':
        result = result.filter(({ summary }) => 
          summary.cleaningStatus === 'NEEDS_CLEANING'
        );
        break;
      case 'checkin':
        result = result.filter(({ tent }) => tent.checkInDate === today);
        break;
      case 'checkout':
        result = result.filter(({ tent }) => tent.checkOutDate === today);
        break;
      case 'full':
        result = result.filter(({ summary }) => summary.freeBeds === 0);
        break;
    }

    return result;
  }, [tentSummaries, searchQuery, activeFilter, today]);

  // Group by double tent for N1-N3
  const groupedTents = useMemo(() => {
    if (!groupByDouble || !hasDoubleTents) return null;

    const groups: Record<string, typeof filteredTents> = {};
    
    filteredTents.forEach(item => {
      const doubleTentId = item.tent.doubleTentId;
      if (doubleTentId) {
        if (!groups[doubleTentId]) {
          groups[doubleTentId] = [];
        }
        groups[doubleTentId].push(item);
      }
    });

    return Object.entries(groups).map(([groupId, tents]) => ({
      groupId,
      groupCode: groupId.replace('double_', ''),
      tents: tents.sort((a, b) => (a.tent.isAlef ? -1 : 1)),
    }));
  }, [filteredTents, groupByDouble, hasDoubleTents]);

  if (isLoading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!neighborhood) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Neighborhood not found</h1>
          <Link to="/" className="text-primary mt-4 block">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'dirty', label: '🧹 Dirty' },
    { key: 'checkin', label: '📅 Check-in Today' },
    { key: 'checkout', label: '📤 Check-out Today' },
    { key: 'full', label: '🔴 Full' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b-2 border-border sticky top-0 z-10">
        <div className="container py-6">
          <BreadcrumbNav items={[{ label: neighborhood.displayName }]} />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{neighborhood.displayName}</h1>
              {neighborhood.description && (
                <p className="text-muted-foreground text-lg mt-1">{neighborhood.description}</p>
              )}
            </div>
            
            {/* Stats */}
            <div className="flex gap-4 text-lg">
              <span className="px-4 py-2 bg-muted rounded-xl">
                <strong>{tentSummaries.length}</strong> tents
              </span>
              <span className="px-4 py-2 bg-primary/10 rounded-xl">
                <strong>
                  {tentSummaries.reduce((acc, t) => acc + t.summary.occupiedBeds, 0)}
                </strong> / {tentSummaries.reduce((acc, t) => acc + t.summary.totalBeds, 0)} beds
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {/* Search & Filters */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tent code or group name..."
              className="w-full pl-14 pr-4 py-4 text-xl rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2">
            <Filter className="w-6 h-6 text-muted-foreground self-center mr-2" />
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={cn(
                  'px-4 py-2 rounded-xl font-semibold transition-all',
                  activeFilter === filter.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {filter.label}
              </button>
            ))}

            {/* Group toggle for N1-N3 */}
            {hasDoubleTents && (
              <button
                onClick={() => setGroupByDouble(!groupByDouble)}
                className={cn(
                  'ml-auto px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2',
                  groupByDouble
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {groupByDouble ? <Layers className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                {groupByDouble ? 'Grouped by Double' : 'Individual Tents'}
              </button>
            )}
          </div>
        </div>

        {/* Tent Grid */}
        {filteredTents.length === 0 ? (
          <div className="tile p-12 text-center">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-xl text-muted-foreground">No tents match your search</p>
          </div>
        ) : groupByDouble && groupedTents ? (
          // Grouped view
          <div className="space-y-8">
            {groupedTents.map((group) => (
              <div key={group.groupId} className="tile p-6">
                <h3 className="text-2xl font-bold mb-4">
                  Double Tent {group.groupCode}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.tents.map(({ summary }) => (
                    <TentCard
                      key={summary.tentId}
                      summary={summary}
                      to={`/tent/${summary.tentId}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Regular grid view
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTents.map(({ summary }) => (
              <TentCard
                key={summary.tentId}
                summary={summary}
                to={`/tent/${summary.tentId}`}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Neighborhood;
