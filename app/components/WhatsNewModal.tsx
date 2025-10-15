"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Github, Bug } from "lucide-react";
import {
  getCurrentVersion,
  getReleasesSince,
  shouldShowChangelog,
  getChangeTypeIcon,
  getChangeTypeColor,
} from "@/lib/version";

const LAST_SEEN_VERSION_KEY = "silverportal_last_seen_version";

interface WhatsNewModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  forceShow?: boolean;
}

export function WhatsNewModal({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  forceShow = false,
}: WhatsNewModalProps) {
  const { data: session } = useSession();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [releases, setReleases] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const effectiveIsOpen =
    externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  useEffect(() => {
    if (!session) return;

    // Automatic detection logic
    if (externalIsOpen === undefined && !forceShow) {
      const currentVersion = getCurrentVersion();
      const lastSeenVersion = localStorage.getItem(LAST_SEEN_VERSION_KEY);

      if (shouldShowChangelog(lastSeenVersion)) {
        const newReleases = getReleasesSince(lastSeenVersion || "0.0.0");
        if (newReleases.length > 0) {
          setReleases(newReleases);
          setInternalIsOpen(true);
        }
      }
    }
  }, [session, externalIsOpen, forceShow]);

  useEffect(() => {
    if (effectiveIsOpen) {
      setShowModal(true);
      // When manually opened, show all recent releases (last 3)
      if (externalIsOpen) {
        const allReleases = getReleasesSince("0.0.0");
        setReleases(allReleases.slice(0, 3));
      }
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShowModal(false), 300); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [effectiveIsOpen, externalIsOpen]);

  useEffect(() => {
    if (showModal) {
      // We need to check for overflow after the modal's entry animation (300ms) has completed.
      const timer = setTimeout(() => {
        const contentElement = contentRef.current;
        if (contentElement) {
          const hasOverflow =
            contentElement.scrollHeight > contentElement.clientHeight;
          setIsOverflowing(hasOverflow);
        }
        setIsContentVisible(true); // Fade in the content
      }, 350); // A delay longer than the transition duration (300ms)

      return () => clearTimeout(timer);
    } else {
      // Reset states when modal closes to ensure correct behavior on reopen
      const timer = setTimeout(() => {
        setIsContentVisible(false);
        setIsExpanded(false);
        setIsOverflowing(false);
      }, 300); // Delay reset until after close animation
      return () => clearTimeout(timer);
    }
  }, [showModal]); // Rerun only when modal visibility changes

  const handleClose = (markAsSeen: boolean = false) => {
    if (markAsSeen) {
      const currentVersion = getCurrentVersion();
      localStorage.setItem(LAST_SEEN_VERSION_KEY, currentVersion);
    }

    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  if (!showModal || releases.length === 0) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-colors duration-300 ease-in-out ${
        isAnimating ? "bg-background-modal" : "bg-black/0"
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleClose(true);
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-modal-title"
        className={`bg-background-primary rounded-lg shadow-xl max-w-4xl w-full flex flex-col max-h-[80vh] transition-all duration-300 ease-in-out transform ${
          isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-blue-700 text-text-white p-6 rounded-t-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="whats-new-modal-title" className="text-2xl font-bold">
                What&apos;s New
              </h2>
              <p className="text-blue-100 mt-1">
                Latest updates and improvements
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/sininspira2/ResourceTracker/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-100 hover:text-white p-1 rounded-full hover:bg-blue-600 transition-colors"
                aria-label="Report a Bug"
                title="Report a Bug"
              >
                <Bug className="w-6 h-6" />
              </a>
              <a
                href="https://github.com/sininspira2/ResourceTracker"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-100 hover:text-white p-1 rounded-full hover:bg-blue-600 transition-colors"
                aria-label="Visit project Github"
                title="Visit project Github"
              >
                <Github className="w-6 h-6" />
              </a>
              <button
                onClick={() => handleClose(true)}
                className="text-blue-100 hover:text-white p-1 rounded-full hover:bg-blue-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className={`p-6 flex-grow transition-all duration-300 ease-in-out ${
            isContentVisible ? "opacity-100" : "opacity-0"
          } ${isExpanded ? "overflow-y-auto" : "overflow-y-hidden"} ${
            // Height transition logic
            !isExpanded && isOverflowing
              ? "max-h-80" // Collapsed state
              : isOverflowing
                ? "max-h-[80vh]" // Expanded state, provide a concrete value for the animation
                : "" // Default state for non-overflowing content
          }`}
        >
          {releases.map((release) => (
            <div key={release.version} className="mb-8 last:mb-0">
              {/* Release Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-text-primary">
                      {release.title}
                    </h3>
                    <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-sm">
                      v{release.version}
                    </span>
                  </div>
                  <p className="text-sm text-text-tertiary mt-1">
                    Released {release.date}
                  </p>
                </div>
              </div>

              {/* Changes */}
              <div className="space-y-3">
                {release.changes.map((change: any, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <span
                      className={`text-sm px-2 py-1 rounded-full ${getChangeTypeColor(change.type)}`}
                    >
                      {getChangeTypeIcon(change.type)}
                    </span>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      {change.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-background-secondary px-6 py-4 rounded-b-lg flex gap-3 flex-shrink-0 items-center">
          {/* See More button - aligned to the left */}
          {isOverflowing && !isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="px-4 py-2 text-sm font-medium text-text-link hover:text-text-link-hover transition-colors"
            >
              See More
            </button>
          )}

          {/* Spacer to push action buttons to the right */}
          <div className="flex-grow" />

          {/* Action Buttons - aligned to the right */}
          {!forceShow && externalIsOpen === undefined && (
            <>
              <button
                onClick={() => handleClose(false)}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-button-tertiary-bg hover:bg-button-tertiary-bg-hover border border-border-secondary rounded-lg transition-colors"
              >
                Remind Me Later
              </button>
              <button
                onClick={() => handleClose(true)}
                className="px-4 py-2 text-sm font-medium text-text-white bg-button-primary-bg hover:bg-button-primary-bg-hover rounded-lg transition-colors"
              >
                Got It!
              </button>
            </>
          )}
          {(forceShow || externalIsOpen !== undefined) && (
            <button
              onClick={() => handleClose(false)}
              className="px-4 py-2 text-sm font-medium text-text-white bg-button-primary-bg hover:bg-button-primary-bg-hover rounded-lg transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
