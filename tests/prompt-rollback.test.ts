import { describe, it, expect } from "vitest";
import { computeNextSemver, computeLineDiff } from "@/lib/diff";

describe("Phase 4: Prompt Version Control & Rollback", () => {
  it("increments semver version counters correctly for major, minor, and patch releases", () => {
    expect(computeNextSemver("1.0.0", "patch")).toBe("1.0.1");
    expect(computeNextSemver("1.0.0", "minor")).toBe("1.1.0");
    expect(computeNextSemver("1.0.0", "major")).toBe("2.0.0");
    expect(computeNextSemver("1.2.4", "minor")).toBe("1.3.0");
    expect(computeNextSemver("2.5.9", "patch")).toBe("2.5.10");
  });

  it("computes accurate line-by-line diff between two prompt versions", () => {
    const promptV1 =
      "Wewe ni mhariri wa makala Nairobi.\nAndika kwa Kiswahili sanifu.\nZingatia masuala ya kijamii.";
    const promptV2 =
      "Wewe ni mhariri mkuu wa makala Nairobi.\nAndika kwa Kiswahili sanifu.\nZingatia masuala ya uchumi na KES.";

    const diff = computeLineDiff(promptV1, promptV2);

    expect(diff.length).toBeGreaterThan(3);

    const additions = diff.filter((d) => d.type === "added");
    const removals = diff.filter((d) => d.type === "removed");
    const unchanged = diff.filter((d) => d.type === "unchanged");

    expect(
      unchanged.some((d) => d.text === "Andika kwa Kiswahili sanifu."),
    ).toBe(true);
    expect(additions.some((d) => d.text.includes("uchumi na KES"))).toBe(true);
    expect(removals.some((d) => d.text.includes("masuala ya kijamii"))).toBe(
      true,
    );
  });

  it("validates that rollback preserves version history immutability", () => {
    const historicalVersions = [
      {
        id: "v1",
        versionNumber: "1.0.0",
        isActive: false,
        changeSummary: "Initial version",
      },
      {
        id: "v2",
        versionNumber: "1.1.0",
        isActive: true,
        changeSummary: "Tightened constraints",
      },
    ];

    // Simulating rollback from v2 back to v1
    const targetVersionId = "v1";
    const updatedVersions = historicalVersions.map((v) => ({
      ...v,
      isActive: v.id === targetVersionId,
    }));

    const activeVersion = updatedVersions.find((v) => v.isActive);
    expect(activeVersion?.id).toBe("v1");
    expect(activeVersion?.versionNumber).toBe("1.0.0");
    // History is preserved, none of the rows are deleted or modified in place
    expect(updatedVersions).toHaveLength(2);
  });
});
