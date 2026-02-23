import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';
import { HE } from '@/lib/translations';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ items }) => {
  const location = useLocation();

  return (
    <nav className="breadcrumb mb-6 flex-wrap text-base md:text-lg">
      <Link 
        to="/" 
        className="breadcrumb-link flex items-center gap-1"
      >
        <Home className="w-5 h-5" />
        <span>{HE.breadcrumb.home}</span>
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronLeft className="w-5 h-5 text-muted-foreground/50" />
          {item.path && item.path !== location.pathname ? (
            <Link to={item.path} className="breadcrumb-link">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
