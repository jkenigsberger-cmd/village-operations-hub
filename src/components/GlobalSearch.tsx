import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVillage } from '@/context/VillageContext';
import { buildSearchIndex, searchIndex, SearchResult } from '@/lib/searchIndex';
import { Search, X, Tent, ShowerHead, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const statusLabels: Record<string, { label: string; className: string }> = {
  CLEAN: { label: 'נקי', className: 'bg-green-500/20 text-green-700' },
  NEEDS_CLEANING: { label: 'דורש ניקיון', className: 'bg-yellow-500/20 text-yellow-700' },
  CLEANING_IN_PROGRESS: { label: 'בתהליך', className: 'bg-blue-500/20 text-blue-700' },
  WORKING: { label: 'תקין', className: 'bg-green-500/20 text-green-700' },
  BROKEN: { label: 'תקול', className: 'bg-red-500/20 text-red-700' },
  MAINTENANCE: { label: 'תחזוקה', className: 'bg-orange-500/20 text-orange-700' },
  FREE: { label: 'פנוי', className: 'bg-green-500/20 text-green-700' },
  RESERVED: { label: 'שמור', className: 'bg-blue-500/20 text-blue-700' },
  OCCUPIED: { label: 'תפוס', className: 'bg-purple-500/20 text-purple-700' },
  BLOCKED: { label: 'חסום', className: 'bg-gray-500/20 text-gray-700' },
};

export const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useVillage();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Build search index when state changes
  const searchIndexData = useMemo(() => {
    if (!state) return [];
    return buildSearchIndex(state);
  }, [state]);

  // Search results
  const results = useMemo(() => {
    return searchIndex(searchIndexData, query);
  }, [searchIndexData, query]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
    setQuery('');
  }, [location.pathname]);

  // Handle keyboard navigation in results
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleResultClick(results[selectedIndex]);
    }
  }, [results, selectedIndex]);

  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, results.length]);

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    
    // Navigate with focus parameter if needed
    if (result.focusId) {
      navigate(`${result.navigateTo}?focus=${result.focusId}`);
    } else {
      navigate(result.navigateTo);
    }
  };

  const renderStatusBadge = (status: string | undefined) => {
    if (!status || !statusLabels[status]) return null;
    const { label, className } = statusLabels[status];
    return (
      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', className)}>
        {label}
      </span>
    );
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 hover:bg-muted rounded-xl text-muted-foreground transition-colors"
        aria-label="חיפוש"
      >
        <Search className="w-5 h-5" />
        <span className="hidden sm:inline text-sm">חיפוש...</span>
        <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-xs bg-background border border-border rounded">
          /
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[10vh] px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false);
              setQuery('');
            }
          }}
        >
          <div className="w-full max-w-xl bg-background rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <Search className="w-6 h-6 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="חיפוש... (לדוגמה: 12 ב׳, ממ״ד 7, מקלחת 6)"
                className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground/60"
                dir="rtl"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 hover:bg-muted rounded-lg text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Results */}
            <div 
              ref={resultsRef}
              className="max-h-[60vh] overflow-y-auto"
            >
              {query && results.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg">לא נמצאו תוצאות</p>
                  <p className="text-sm mt-1">נסה חיפוש אחר</p>
                </div>
              )}

              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 text-right transition-colors',
                    'hover:bg-muted/50',
                    index === selectedIndex && 'bg-primary/10'
                  )}
                >
                  {/* Icon */}
                  <span className="text-2xl flex-shrink-0">{result.icon}</span>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-lg truncate">
                        {result.primaryLabel}
                      </span>
                      {/* Status badges */}
                      {renderStatusBadge(result.cleaningStatus)}
                      {renderStatusBadge(result.workingStatus)}
                      {result.type === 'tent' && renderStatusBadge(result.occupancyStatus)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {result.secondaryLabel}
                    </p>
                  </div>

                  {/* Type indicator */}
                  <span className="text-xs text-muted-foreground/60 flex-shrink-0">
                    {result.type === 'tent' && 'אוהל'}
                    {result.type === 'facility' && 'מתקן'}
                    {result.type === 'activitySpace' && 'מרחב'}
                  </span>
                </button>
              ))}
            </div>

            {/* Footer hint */}
            {query && results.length > 0 && (
              <div className="p-3 border-t border-border bg-muted/30 text-center text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">↓</kbd>
                  לניווט
                  <kbd className="px-1.5 py-0.5 bg-background border border-border rounded mr-3">Enter</kbd>
                  לבחירה
                  <kbd className="px-1.5 py-0.5 bg-background border border-border rounded mr-3">Esc</kbd>
                  לסגירה
                </span>
              </div>
            )}

            {/* Empty state suggestions */}
            {!query && (
              <div className="p-6 text-muted-foreground">
                <p className="text-sm mb-4">חפש לפי:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⛺</span>
                    <span>אוהלים: "12 ב׳", "VIP 83", "55"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚿</span>
                    <span>מקלחות: "מקלחת 6", "מקלחת 28"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚻</span>
                    <span>שירותים: "תא 33", "שירותים חדר אוכל"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🧱</span>
                    <span>מרחבים: "ממ״ד 7", "אוהל מועד", "חדר אוכל"</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
