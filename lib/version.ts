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

// Get the current version
export const getCurrentVersion = (): string => {
  return changelog.currentVersion;
};

// Get the latest release
export const getLatestRelease = (): Release | null => {
  return changelog.releases[0] || null;
};

// Get releases since a specific version
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

// Compare two version strings (returns 1 if a > b, -1 if a < b, 0 if equal)
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

// Check if user should see changelog
export const shouldShowChangelog = (
  lastSeenVersion: string | null,
): boolean => {
  if (!lastSeenVersion) return true;
  return compareVersions(getCurrentVersion(), lastSeenVersion) > 0;
};

// Get the change type icon
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

// Get the change type color
export const getChangeTypeColor = (type: ChangelogEntry["type"]): string => {
  switch (type) {
    case "feature":
      return "text-blue-600 dark:text-blue-400";
    case "improvement":
      return "text-green-600 dark:text-green-400";
    case "bugfix":
      return "text-orange-600 dark:text-orange-400";
    case "breaking":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
};
