"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Layers,
  Trophy,
  Activity,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { VersionDisplay } from "./VersionDisplay";
import { WhatsNewModal } from "./WhatsNewModal";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Tracker",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard size={17} strokeWidth={1.8} />,
        exact: true,
      },
      {
        href: "/resources",
        label: "Resources",
        icon: <Layers size={17} strokeWidth={1.8} />,
      },
      {
        href: "/dashboard/leaderboard",
        label: "Leaderboard",
        icon: <Trophy size={17} strokeWidth={1.8} />,
      },
      {
        href: "/dashboard/activity",
        label: "Activity",
        icon: <Activity size={17} strokeWidth={1.8} />,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        href: "/dashboard/settings",
        label: "Settings",
        icon: <Settings size={17} strokeWidth={1.8} />,
      },
      {
        href: "/dashboard/privacy",
        label: "Privacy",
        icon: <Shield size={17} strokeWidth={1.8} />,
      },
    ],
  },
];

function isNavItemActive(href: string, pathname: string, exact = false) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

interface SidebarNavItemProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}

function SidebarNavItem({ item, active, collapsed }: SidebarNavItemProps) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className="relative flex items-center rounded-lg text-sm font-medium transition-colors duration-100"
      style={{
        gap: collapsed ? 0 : 12,
        padding: collapsed ? "9px 0" : "9px 12px",
        justifyContent: collapsed ? "center" : "flex-start",
        background: active ? "color-mix(in srgb, #3b82f6 12%, transparent)" : "transparent",
        color: active ? "#3b82f6" : undefined,
      }}
    >
      {active && !collapsed && (
        <span
          className="absolute rounded-full"
          style={{
            left: -10,
            top: 8,
            bottom: 8,
            width: 3,
            background: "#3b82f6",
          }}
        />
      )}
      <span className={active ? "text-text-link" : "text-text-tertiary"}>
        {item.icon}
      </span>
      {!collapsed && (
        <span className={active ? "text-text-link" : "text-text-secondary"}>
          {item.label}
        </span>
      )}
    </Link>
  );
}

interface UserBadgeProps {
  session: ReturnType<typeof useSession>["data"];
  collapsed: boolean;
}

function UserBadge({ session, collapsed }: UserBadgeProps) {
  if (!session?.user) return null;

  const user = session.user as {
    name?: string;
    discordNickname?: string;
    global_name?: string;
    permissions?: { hasResourceAdminAccess?: boolean };
  };

  const displayName =
    user.discordNickname || user.global_name || user.name || "User";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const isAdmin = user.permissions?.hasResourceAdminAccess;
  const role = isAdmin ? "Admin" : "Member";

  return (
    <div
      className="flex items-center rounded-lg"
      style={{
        gap: collapsed ? 0 : 10,
        padding: collapsed ? 0 : "8px 10px",
        background: collapsed ? "transparent" : undefined,
        border: collapsed ? "none" : "1px solid",
        borderColor: collapsed ? "transparent" : undefined,
        minWidth: 0,
      }}
    >
      <div
        className="flex shrink-0 items-center justify-center rounded-full border border-border-primary bg-background-secondary font-mono text-xs font-bold text-text-secondary"
        style={{ width: 28, height: 28 }}
        title={displayName}
      >
        {initials}
      </div>
      {!collapsed && (
        <>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-text-primary leading-tight">
              {displayName}
            </div>
            <div className="text-[10px] text-text-tertiary mt-0.5">{role}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            title="Sign out"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-background-tertiary hover:text-text-secondary"
          >
            <LogOut size={14} />
          </button>
        </>
      )}
    </div>
  );
}

interface AppShellProps {
  children: ReactNode;
  title: string;
}

export function AppShell({ children, title }: AppShellProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  // Persist collapsed state across page navigations
  useEffect(() => {
    const stored = localStorage.getItem("nav-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("nav-collapsed", String(next));
  };

  // Current page label for mobile header
  const currentLabel = (() => {
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        if (isNavItemActive(item.href, pathname, item.exact)) return item.label;
      }
    }
    return title;
  })();

  return (
    <>
      <div className="flex min-h-screen bg-background-primary transition-colors duration-300">
        {/* ── Desktop sidebar ── */}
        <aside
          className="hidden md:flex flex-col border-r border-border-primary bg-background-secondary overflow-hidden"
          style={{
            width: collapsed ? 68 : 232,
            flexShrink: 0,
            position: "sticky",
            top: 0,
            height: "100vh",
            padding: collapsed ? "16px 10px" : "16px 14px",
            gap: 18,
            transition: "width 220ms cubic-bezier(0.4,0,0.2,1), padding 220ms cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {/* OrgMark + collapse button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className="flex shrink-0 items-center justify-center rounded-lg bg-button-primary-bg font-mono text-xs font-bold text-text-white"
                style={{ width: 32, height: 32 }}
              >
                RT
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-text-primary leading-tight">
                    {title}
                  </div>
                  <VersionDisplay
                    onClick={() => setShowChangelog(true)}
                    className="px-0 py-0 text-[10px]"
                  />
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={toggleCollapsed}
                title="Collapse sidebar"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border-primary text-text-tertiary transition-colors hover:bg-background-tertiary"
              >
                <ChevronLeft size={12} />
              </button>
            )}
          </div>

          {/* Expand button (collapsed state) */}
          {collapsed && (
            <button
              onClick={toggleCollapsed}
              title="Expand sidebar"
              className="flex h-6 w-full items-center justify-center rounded-md border border-border-primary text-text-tertiary transition-colors hover:bg-background-tertiary"
            >
              <ChevronRight size={12} />
            </button>
          )}

          {/* Nav sections */}
          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
            {NAV_SECTIONS.map((section, si) => (
              <div key={section.label}>
                {!collapsed ? (
                  <div
                    className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-text-quaternary"
                    style={{ paddingTop: si > 0 ? 14 : 4 }}
                  >
                    {section.label}
                  </div>
                ) : (
                  si > 0 && <div style={{ height: 8 }} />
                )}
                {section.items.map((item) => (
                  <SidebarNavItem
                    key={item.href}
                    item={item}
                    active={isNavItemActive(item.href, pathname, item.exact)}
                    collapsed={collapsed}
                  />
                ))}
              </div>
            ))}
          </nav>

          {/* Bottom: theme + user */}
          <div className="flex flex-col gap-2.5">
            <div
              className="flex items-center"
              style={{
                justifyContent: collapsed ? "center" : "space-between",
                padding: collapsed ? 0 : "0 4px",
              }}
            >
              {!collapsed && (
                <span className="text-xs font-medium text-text-tertiary">
                  Theme
                </span>
              )}
              <ThemeToggle className="h-8 w-8" />
            </div>
            <UserBadge session={session} collapsed={collapsed} />
          </div>
        </aside>

        {/* ── Content column ── */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border-primary bg-background-secondary px-4 py-2.5 md:hidden">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-primary bg-background-tertiary text-text-primary transition-colors hover:bg-background-secondary"
              >
                <Menu size={18} />
              </button>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center rounded-md bg-button-primary-bg font-mono text-[11px] font-bold text-text-white"
                  style={{ width: 26, height: 26 }}
                >
                  RT
                </div>
                <span className="text-sm font-semibold text-text-primary">
                  {currentLabel}
                </span>
              </div>
            </div>
            <ThemeToggle className="h-8 w-8" />
          </header>

          {/* Page content */}
          {children}
        </div>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute bottom-0 left-0 top-0 flex w-64 flex-col gap-3.5 border-r border-border-primary bg-background-secondary p-4"
            style={{ animation: "slideInFromLeft 180ms ease" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex items-center justify-center rounded-lg bg-button-primary-bg font-mono text-xs font-bold text-text-white"
                  style={{ width: 32, height: 32 }}
                >
                  RT
                </div>
                <div>
                  <div className="text-sm font-bold text-text-primary">
                    {title}
                  </div>
                  <VersionDisplay
                    onClick={() => {
                      setDrawerOpen(false);
                      setShowChangelog(true);
                    }}
                    className="px-0 py-0 text-[10px]"
                  />
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border-primary text-text-secondary transition-colors hover:bg-background-tertiary"
              >
                <X size={14} />
              </button>
            </div>

            {/* Drawer nav */}
            <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
              {NAV_SECTIONS.map((section, si) => (
                <div key={section.label}>
                  <div
                    className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-text-quaternary"
                    style={{ paddingTop: si > 0 ? 14 : 4 }}
                  >
                    {section.label}
                  </div>
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                      style={{
                        background: isNavItemActive(item.href, pathname, item.exact)
                          ? "color-mix(in srgb, #3b82f6 12%, transparent)"
                          : "transparent",
                        color: isNavItemActive(item.href, pathname, item.exact)
                          ? "#3b82f6"
                          : undefined,
                      }}
                    >
                      <span
                        className={
                          isNavItemActive(item.href, pathname, item.exact)
                            ? "text-text-link"
                            : "text-text-tertiary"
                        }
                      >
                        {item.icon}
                      </span>
                      <span
                        className={
                          isNavItemActive(item.href, pathname, item.exact)
                            ? "text-text-link"
                            : "text-text-secondary"
                        }
                      >
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </div>
              ))}
            </nav>

            {/* Drawer footer */}
            <UserBadge session={session} collapsed={false} />
          </div>
        </div>
      )}

      {/* Changelog modal */}
      {showChangelog && (
        <WhatsNewModal
          isOpen={showChangelog}
          onClose={() => setShowChangelog(false)}
          forceShow={true}
        />
      )}

      <style>{`
        @keyframes slideInFromLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
