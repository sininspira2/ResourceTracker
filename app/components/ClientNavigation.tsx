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
      <nav className="bg-background-secondary shadow-xs border-b border-border-primary transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Title and Version */}
            <div className="flex items-center gap-3">
              {showDashboardLink && (
                <Link
                  href="/dashboard"
                  className="sm:hidden text-text-tertiary hover:text-text-link"
                >
                  <ArrowLeft size={24} />
                </Link>
              )}
              <Link
                href="/"
                className="text-xl font-bold text-text-primary hover:text-text-link transition-colors truncate"
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
                  className="hidden sm:flex text-text-tertiary hover:text-text-link px-3 py-2 text-sm font-medium transition-colors"
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
