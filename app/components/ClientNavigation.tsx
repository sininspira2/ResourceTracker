"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { LoginButton } from "./LoginButton";
import { LogoutButton } from "./LogoutButton";
import { ThemeToggle } from "./ThemeToggle";
import { VersionDisplay } from "./VersionDisplay";
import { WhatsNewModal } from "./WhatsNewModal";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

interface ClientNavigationProps {
  title: string;
  showDashboardLink?: boolean;
}

export function ClientNavigation({
  title,
  showDashboardLink = true,
}: ClientNavigationProps) {
  const { data: session } = useSession();
  const [showChangelog, setShowChangelog] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <nav className="border-b border-border-primary bg-background-secondary shadow-xs transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Left side - Title and Version */}
            <div className="flex items-center gap-3">
              {showDashboardLink && (
                <Link
                  href="/dashboard"
                  className="text-text-tertiary hover:text-text-link sm:hidden"
                >
                  <ArrowLeft size={24} />
                </Link>
              )}
              <Link
                href="/"
                className="truncate text-xl font-bold text-text-primary transition-colors hover:text-text-link"
                title={title}
              >
                {title}
              </Link>
              <VersionDisplay onClick={() => setShowChangelog(true)} />
            </div>

            {/* Right side - Navigation and Auth */}
            <div className="flex items-center gap-4">
              {session && showDashboardLink && (
                <Link
                  href="/dashboard"
                  className="hidden px-3 py-2 text-sm font-medium text-text-tertiary transition-colors hover:text-text-link sm:flex"
                >
                  Dashboard
                </Link>
              )}

              {isMounted && <ThemeToggle />}

              {session ? <LogoutButton /> : <LoginButton />}
            </div>
          </div>
        </div>
      </nav>

      {/* Changelog Modal */}
      {showChangelog && (
        <WhatsNewModal
          isOpen={showChangelog}
          onClose={() => setShowChangelog(false)}
          forceShow={true}
        />
      )}
    </>
  );
}
