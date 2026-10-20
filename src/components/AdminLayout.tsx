```tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  Briefcase,
  Home as HomeIcon,
  FolderKanban,
  FileText,
  CreditCard,
  Sparkles,
  Megaphone,
  BarChart3,
  Settings,
  Plug,
  ScrollText,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Footer from './Footer';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Main',
    items: [
      { label: 'Overview', icon: LayoutDashboard, path: '/admin' },
      { label: 'Users & Verification', icon: UserCheck, path: '/admin/users' },
      { label: 'Designers', icon: Briefcase, path: '/admin/designers' },
      { label: 'Homeowners', icon: HomeIcon, path: '/admin/homeowners' },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { label: 'Projects', icon: FolderKanban, path: '/admin/projects' },
      { label: 'Quotations', icon: FileText, path: '/admin/quotations' },
      {
        label: 'Subscriptions & Billing',
        icon: CreditCard,
        path: '/admin/subscriptions',
      },
      { label: 'AI Quotation', icon: Sparkles, path: '/admin/ai-monitoring' },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { label: 'Content & Marketing', icon: Megaphone, path: '/admin/content' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Analytics & Reports', icon: BarChart3, path: '/admin/analytics' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Platform Settings', icon: Settings, path: '/admin/settings' },
      { label: 'Integrations', icon: Plug, path: '/admin/integrations' },
      { label: 'Audit Logs', icon: ScrollText, path: '/admin/audit-logs' },
    ],
  },
];

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }

    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const closeMobileSidebar = () => setSidebarOpen(false);

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-secondary-900 text-gray-300">
      {/* Sidebar header: branding and desktop/mobile controls */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-secondary-700/50 px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500">
          <LayoutDashboard className="h-5 w-5 text-white" />
        </div>

        {desktopSidebarOpen || sidebarOpen ? (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                Admin Console
              </p>
              <p className="truncate text-xs text-gray-400">
                TheHomeDesigners
              </p>
            </div>

            {/* One close/collapse control inside the sidebar */}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setDesktopSidebarOpen(false);
                } else {
                  setSidebarOpen(false);
                }
              }}
              className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-secondary-800 hover:text-white"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setDesktopSidebarOpen(true)}
            className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-secondary-800 hover:text-white"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Scrollable sidebar: navigation AND Sign Out */}
      <nav className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                {section.title}
              </p>

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => {
                        navigate(item.path);
                        closeMobileSidebar();
                      }}
                      title={!desktopSidebarOpen ? item.label : undefined}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                        active
                          ? 'bg-sky-500/15 text-sky-300'
                          : 'text-gray-400 hover:bg-secondary-800 hover:text-gray-200'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          active ? 'text-sky-400' : ''
                        }`}
                      />

                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>

                      {active && (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Sign Out is inside the same scrollable nav container */}
          <div className="border-t border-secondary-700/50 pt-4">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full overflow-x-clip bg-gray-50">
      {/* Desktop sidebar: participates in layout instead of being fixed */}
      {desktopSidebarOpen && (
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 self-start lg:block">
          {sidebar}
        </aside>
      )}

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={closeMobileSidebar}
          />

          <aside className="fixed inset-y-0 left-0 z-50 block h-screen w-60 max-w-[85vw] lg:hidden">
            {sidebar}
          </aside>
        </>
      )}

      {/* Main content column */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Desktop header */}
        <header className="sticky top-0 z-30 hidden h-16 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-6 lg:flex">
          {!desktopSidebarOpen && (
            <button
              type="button"
              onClick={() => setDesktopSidebarOpen(true)}
              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              aria-label="Open sidebar"
              title="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <span className="font-semibold text-gray-800">Admin Console</span>
        </header>

        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100"
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <span className="text-sm font-semibold text-gray-800">
            Admin Console
          </span>

          <div className="w-9" aria-hidden="true" />
        </header>

        {/* Dashboard content */}
        <main className="min-w-0 flex-1">{children}</main>

        {/* Footer stays aligned with the main content column */}
        <Footer />
      </div>
    </div>
  );
};

export default AdminLayout;
```

