
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

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  const sidebarContent = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-secondary-900 text-gray-300">
      {/* Sidebar header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-secondary-700/50 px-3 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500">
          <LayoutDashboard className="h-5 w-5 text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            Admin Console
          </p>
          <p className="truncate text-xs text-gray-400">
            TheHomeDesigners
          </p>
        </div>

        {/* Desktop toggle: visible inside the expanded sidebar */}
        <button
          type="button"
          onClick={() => setDesktopSidebarOpen(false)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-secondary-800 hover:text-white"
          aria-label="Close sidebar"
          title="Close sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile drawer close button */}
        <button
          type="button"
          onClick={closeMobileSidebar}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-secondary-800 hover:text-white lg:hidden"
          aria-label="Close sidebar"
          title="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable navigation, including Sign Out */}
      <nav
        aria-label="Admin navigation"
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-4"
      >
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

          {/* Sign Out is inside the scrollable container */}
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
      {/* Desktop sidebar */}
      {desktopSidebarOpen && (
        <aside className="fixed inset-y-0 left-0 z-30 hidden h-dvh w-60 overflow-hidden lg:block">
          {sidebarContent}
        </aside>
      )}

      {/* Mobile sidebar drawer */}
      {mobileSidebarOpen && (
        <>
          <button
            type="button"
            aria-label="Close sidebar overlay"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={closeMobileSidebar}
          />

          <aside className="fixed inset-y-0 left-0 z-50 h-dvh w-60 max-w-[85vw] overflow-hidden lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main content */}
      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col ${
          desktopSidebarOpen ? 'lg:ml-60' : ''
        }`}
      >
        {/* Desktop header: toggle appears here only when sidebar is closed */}
        <header className="sticky top-0 z-20 hidden h-16 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-6 lg:flex">
          {!desktopSidebarOpen && (
            <button
              type="button"
              onClick={() => setDesktopSidebarOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              aria-label="Open sidebar"
              title="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <span className="font-semibold text-gray-800">
            Admin Console
          </span>
        </header>

        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100"
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
        <main className="min-w-0 flex-1">
          {children}
        </main>

        {/* Footer aligned with the main content column */}
        <Footer />
      </div>
    </div>
  );
};

export default AdminLayout;
