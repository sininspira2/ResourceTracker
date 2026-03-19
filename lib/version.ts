import changelogData from "./changelog.json";

export interface ChangelogEntry {
  type: "feature" | "improvement" | "bugfix" | "breaking";
  description: string;
}

export interface Release {
  version: string;
  date: string;
  title: string;
  type: "major" | "minor" | "patch";
  changes: ChangelogEntry[];
}

export interface Changelog {
  currentVersion: string;
  releases: Release[];
}

export const changelog: Changelog = changelogData as Changelog;

/**
 * Returns the current application version string from the changelog.
 *
 * @returns The `currentVersion` field from `changelog.json`
 */
export const getCurrentVersion = (): string => {
  return changelog.currentVersion;
};

/**
 * Returns the most recent release entry from the changelog, or `null` if the
 * changelog has no releases.
 */
export const getLatestRelease = (): Release | null => {
  return changelog.releases[0] || null;
};

/**
 * Returns all releases newer than `lastSeenVersion`, in descending order.
 *
 * If `lastSeenVersion` is an empty string, only the latest release is returned
 * (useful for first-time visitors who have never seen a changelog).
 *
 * @param lastSeenVersion - The last version the user has already seen
 * @returns Array of `Release` objects with versions greater than `lastSeenVersion`
 */
export const getReleasesSince = (lastSeenVersion: string): Release[] => {
  if (!lastSeenVersion) {
    const latest = getLatestRelease();
    return latest ? [latest] : [];
  }

  const releases: Release[] = [];
  for (const release of changelog.releases) {
    if (compareVersions(release.version, lastSeenVersion) > 0) {
      releases.push(release);
    } else {
      break; // Since releases are in descending order
    }
  }
  return releases;
};

/**
 * Compares two semver-style version strings.
 *
 * @param a - First version string (e.g. `"1.2.3"`)
 * @param b - Second version string (e.g. `"1.2.0"`)
 * @returns `1` if `a > b`, `-1` if `a < b`, `0` if equal
 */
export const compareVersions = (a: string, b: string): number => {
  const parseVersion = (version: string) =>
    version.split(".").map((num) => parseInt(num, 10));

  const versionA = parseVersion(a);
  const versionB = parseVersion(b);

  for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
    const numA = versionA[i] || 0;
    const numB = versionB[i] || 0;

    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }

  return 0;
};

/**
 * Determines whether the changelog modal should be shown to the user.
 *
 * Returns `true` if the user has never seen any version (`lastSeenVersion` is
 * `null`) or if the current version is newer than the last-seen version.
 *
 * @param lastSeenVersion - The last version the user acknowledged, or `null`
 * @returns `true` if the changelog should be displayed
 */
export const shouldShowChangelog = (
  lastSeenVersion: string | null,
): boolean => {
  if (!lastSeenVersion) return true;
  return compareVersions(getCurrentVersion(), lastSeenVersion) > 0;
};

/**
 * Returns the emoji icon associated with a changelog entry type.
 *
 * @param type - The change type (`"feature"`, `"improvement"`, `"bugfix"`, or `"breaking"`)
 * @returns An emoji string representing the change type
 */
export const getChangeTypeIcon = (type: ChangelogEntry["type"]): string => {
  switch (type) {
    case "feature":
      return "✨";
    case "improvement":
      return "🔧";
    case "bugfix":
      return "🐛";
    case "breaking":
      return "⚠️";
    default:
      return "📝";
  }
};

/**
 * Returns the Tailwind CSS text-color class associated with a changelog entry type.
 *
 * @param type - The change type (`"feature"`, `"improvement"`, `"bugfix"`, or `"breaking"`)
 * @returns A Tailwind CSS class string (e.g. `"text-text-link"`)
 */
export const getChangeTypeColor = (type: ChangelogEntry["type"]): string => {
  switch (type) {
    case "feature":
      return "text-text-link";
    case "improvement":
      return "text-text-success";
    case "bugfix":
      return "text-text-bugfix";
    case "breaking":
      return "text-text-breaking";
    default:
      return "text-text-tertiary";
  }
};
