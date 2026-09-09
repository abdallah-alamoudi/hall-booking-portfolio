import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Building2, CalendarRange, LayoutDashboard, LogOut, Settings } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const SidebarLink = ({ to, icon: Icon, children, compact = false }) => {
  const label = typeof children === 'string' ? children : undefined;

  return (
    <NavLink
      to={to}
      aria-label={compact ? label : undefined}
      title={compact ? label : undefined}
      className={({ isActive }) =>
        cn(
          'group flex items-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          compact ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5',
          isActive
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
            : 'text-slate-600 hover:bg-white hover:text-slate-900'
        )
      }
    >
      <Icon className={cn('h-4 w-4', !compact && 'opacity-85 group-hover:opacity-100')} />
      {compact ? <span className="sr-only">{children}</span> : <span className="text-sm font-semibold tracking-tight">{children}</span>}
    </NavLink>
  );
};

export function DashboardLayout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isOwner = user?.role === 'OWNER';
  const ownerNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Overview' },
    { to: '/owner/halls', icon: Building2, label: 'My Venue' },
    { to: '/owner/bookings', icon: CalendarRange, label: 'Bookings' }
  ];
  const adminNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin', icon: Settings, label: 'Admin Panel' }
  ];
  const navItems = isOwner ? ownerNavItems : adminNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_10%_0%,_hsl(184_54%_91%),_hsl(38_70%_97%)_55%,_hsl(0_0%_100%)_100%)] text-foreground">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200/70 bg-white/70 backdrop-blur-xl md:block">
        <div className="flex h-20 items-center border-b border-slate-200/70 px-6">
          <Link to="/" className="group flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-2.5 transition-colors group-hover:bg-primary/20">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900">Venue Desk</span>
              <span className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">Operations Console</span>
            </div>
          </Link>
        </div>
        <div className="space-y-7 p-5">
          <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Navigation</div>
            <div className="space-y-1.5">
              {navItems.map((item) => (
                <SidebarLink key={item.to} to={item.to} icon={item.icon}>
                  {item.label}
                </SidebarLink>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/70 bg-slate-900 p-4 text-slate-100 shadow-sm">
            <p className="text-sm font-semibold tracking-tight">One Venue Rule Active</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              You can manage one active venue at a time. Update details anytime from your venue workspace.
            </p>
          </div>
        </div>
        <div className="absolute bottom-5 left-5 right-5">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-xl text-slate-500 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col md:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-white/70 bg-white/65 px-4 py-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
              <p className="text-xs font-medium uppercase tracking-[0.13em] text-slate-500">
                {isOwner ? 'Owner workspace' : 'Admin workspace'}
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2 shadow-sm">
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-sm font-semibold text-slate-900">{user?.fullName || user?.email}</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{user?.role}</span>
              </div>
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                  {user?.fullName?.[0] || user?.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-8">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/90 p-2 backdrop-blur-xl md:hidden">
        <div className={cn('grid gap-2', navItems.length <= 2 ? 'grid-cols-2' : 'grid-cols-3')}>
          {navItems.slice(0, 3).map((item) => (
            <SidebarLink key={item.to} to={item.to} icon={item.icon} compact>
              {item.label}
            </SidebarLink>
          ))}
        </div>
        <div className="mt-2">
          <Button
            variant="ghost"
            className="w-full gap-2 rounded-xl text-slate-600 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
