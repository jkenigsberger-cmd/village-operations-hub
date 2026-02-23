import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { Users, DollarSign, Receipt, UserCheck, BarChart3, Briefcase, FileText, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  section?: 'groups' | 'management';
}

const groupNavItems = [
  { path: '/admin/groups', label: 'קבוצות / הזמנות', icon: Users },
];

const managementNavItems = [
  { path: '/admin/income', label: 'הכנסות', icon: DollarSign },
  { path: '/admin/expenses', label: 'הוצאות', icon: Receipt },
  { path: '/admin/outsourced', label: 'עובדים חיצוניים', icon: UserCheck },
  { path: '/admin/reports', label: 'דוחות', icon: BarChart3 },
  { path: '/admin/quotes', label: 'הצעות מחיר', icon: FileText },
  { path: '/admin/users', label: 'משתמשים', icon: Shield },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle, section = 'groups' }) => {
  const location = useLocation();
  const navItems = section === 'groups' ? groupNavItems : managementNavItems;
  const HeaderIcon = section === 'groups' ? Users : Briefcase;
  const breadcrumbLabel = section === 'groups' ? 'קבוצות / הזמנות' : 'הנהלה';

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="bg-card border-b-2 border-border">
        <div className="container py-6">
          <BreadcrumbNav items={[{ label: 'הנהלה-הזמנות', path: '/settings' }, { label: breadcrumbLabel }]} />
          <div className="flex items-center gap-3">
            <HeaderIcon className="w-8 h-8 md:w-10 md:h-10" />
            <div>
              <h1 className="text-2xl md:text-4xl font-bold">{title}</h1>
              {subtitle && <p className="text-muted-foreground text-lg mt-1">{subtitle}</p>}
            </div>
          </div>
        </div>
      </header>

      {/* Admin internal navigation - only show if more than 1 tab */}
      {navItems.length > 1 && (
        <nav className="bg-muted/50 border-b relative">
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-muted/50 to-transparent pointer-events-none z-10 md:hidden" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-muted/50 to-transparent pointer-events-none z-10 md:hidden" />
          
          <div className="container overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 py-2 min-w-max">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 md:py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-colors min-h-[48px] touch-target flex-shrink-0',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5 md:w-4 md:h-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      <main className="container py-6">{children}</main>
    </div>
  );
};
