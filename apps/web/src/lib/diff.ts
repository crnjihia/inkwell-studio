export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  text: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

// Compute line-by-line diff between two prompt texts
export function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  const diff: DiffLine[] = [];
  let i = 0;
  let j = 0;

  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length) {
      if (oldLines[i] === newLines[j]) {
        diff.push({
          type: "unchanged",
          text: oldLines[i],
          oldLineNumber: i + 1,
          newLineNumber: j + 1,
        });
        i++;
        j++;
      } else {
        // Line removed from old
        diff.push({
          type: "removed",
          text: oldLines[i],
          oldLineNumber: i + 1,
        });
        i++;
        // Line added to new
        diff.push({
          type: "added",
          text: newLines[j],
          newLineNumber: j + 1,
        });
        j++;
      }
    } else if (i < oldLines.length) {
      diff.push({
        type: "removed",
        text: oldLines[i],
        oldLineNumber: i + 1,
      });
      i++;
    } else if (j < newLines.length) {
      diff.push({
        type: "added",
        text: newLines[j],
        newLineNumber: j + 1,
      });
      j++;
    }
  }

  return diff;
}

// Compute next semver version string based on current and change type
export function computeNextSemver(
  currentVersion: string,
  type: "major" | "minor" | "patch" = "minor",
): string {
  const parts = currentVersion.split(".").map((n) => parseInt(n, 10));
  const major = isNaN(parts[0]) ? 1 : parts[0];
  const minor = isNaN(parts[1]) ? 0 : parts[1];
  const patch = isNaN(parts[2]) ? 0 : parts[2];

  if (type === "major") {
    return `${major + 1}.0.0`;
  } else if (type === "minor") {
    return `${major}.${minor + 1}.0`;
  } else {
    return `${major}.${minor}.${patch + 1}`;
  }
}
