#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const changelogPath = path.join(__dirname, "../lib/changelog.json");

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function parseVersion(version) {
  return version.split(".").map((num) => parseInt(num, 10));
}

function incrementVersion(version, type) {
  const [major, minor, patch] = parseVersion(version);

  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      return version;
  }
}

async function updateChangelog() {
  try {
    // Read current changelog
    const changelog = JSON.parse(fs.readFileSync(changelogPath, "utf8"));
    const currentVersion = changelog.currentVersion;

    console.log(`🚀 Resource Tracker Changelog Updater`);
    console.log(`Current version: v${currentVersion}\n`);

    // Get version type
    console.log("What type of update is this?");
    console.log("1. Patch (1.2.0 → 1.2.1) - Bug fixes, small improvements");
    console.log(
      "2. Minor (1.2.0 → 1.3.0) - New features, non-breaking changes",
    );
    console.log("3. Major (1.2.0 → 2.0.0) - Breaking changes, major features");
    console.log("4. Custom version");

    const versionChoice = await question("Choose (1-4): ");

    let newVersion;

    if (versionChoice === "4") {
      newVersion = await question("Enter custom version (e.g., 1.2.1): ");
    } else {
      const versionType =
        versionChoice === "1"
          ? "patch"
          : versionChoice === "2"
            ? "minor"
            : "major";
      newVersion = incrementVersion(currentVersion, versionType);
    }

    // Get release info
    const title = await question(
      `Release title (e.g., "Bug Fixes & Improvements"): `,
    );
    const type =
      (await question("Release type (major/minor/patch): ")) || "patch";

    console.log(
      "\n📝 Add changes one by one. Press Enter on empty line to finish.",
    );

    const changes = [];
    let changeIndex = 1;

    while (true) {
      const changeType = await question(
        `\nChange ${changeIndex} type (feature/improvement/bugfix/breaking) [Enter to finish]: `,
      );
      if (!changeType.trim()) break;

      const description = await question(`Change ${changeIndex} description: `);
      if (!description.trim()) break;

      changes.push({
        type: changeType.trim(),
        description: description.trim(),
      });

      changeIndex++;
    }

    if (changes.length === 0) {
      console.log("❌ No changes added. Aborting.");
      rl.close();
      return;
    }

    // Create new release
    const newRelease = {
      version: newVersion,
      date: new Date().toISOString().split("T")[0],
      title: title || `Version ${newVersion}`,
      type: type,
      changes: changes,
    };

    // Update changelog
    changelog.currentVersion = newVersion;
    changelog.releases.unshift(newRelease);

    // Write back to file
    fs.writeFileSync(changelogPath, JSON.stringify(changelog, null, 2));

    console.log(`\n✅ Changelog updated successfully!`);
    console.log(`🎉 Version bumped from v${currentVersion} to v${newVersion}`);
    console.log(`📝 Added ${changes.length} change(s)`);
    console.log(`\nNext steps:`);
    console.log(`1. Review the changes in lib/changelog.json`);
    console.log(
      `2. Commit your changes: git add -A && git commit -m "Release v${newVersion}"`,
    );
    console.log(
      `3. Users will see the "What's New" modal on their next visit!`,
    );
  } catch (error) {
    console.error("❌ Error updating changelog:", error.message);
  }

  rl.close();
}

updateChangelog();
