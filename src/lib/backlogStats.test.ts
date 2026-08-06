import { describe, test, expect } from "vitest";
import {
  isStale,
  ageInDays,
  computeBacklogStats,
  triageSort,
  applyFilter,
  STALE_THRESHOLD_MS,
} from "../lib/backlogStats";
import type { Task } from "../types/task";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? Math.random().toString(36),
    title: overrides.title ?? "Untitled",
    priority: overrides.priority ?? "normal",
    done: overrides.done ?? false,
    createdAt: overrides.createdAt ?? Date.now(),
  };
}

describe("isStale", () => {
  test("a fresh open task is not stale", () => {
    const task = makeTask({ createdAt: Date.now() });
    expect(isStale(task)).toBe(false);
  });

  test("an open task older than the threshold is stale", () => {
    const task = makeTask({
      createdAt: Date.now() - STALE_THRESHOLD_MS - 1000,
    });
    expect(isStale(task)).toBe(true);
  });

  test("a done task is never stale, even if old", () => {
    const task = makeTask({
      createdAt: Date.now() - STALE_THRESHOLD_MS - 1000,
      done: true,
    });
    expect(isStale(task)).toBe(false);
  });
});

describe("ageInDays", () => {
  test("a task created now is 0 days old", () => {
    expect(ageInDays(Date.now())).toBe(0);
  });

  test("a task created 3 days ago is 3 days old", () => {
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    expect(ageInDays(Date.now() - threeDaysMs)).toBe(3);
  });
});

describe("computeBacklogStats", () => {
  test("counts open, urgent, and stale correctly, ignores done tasks", () => {
    const tasks = [
      makeTask({ priority: "urgent", done: false }),
      makeTask({ priority: "urgent", done: true }), // done, shouldn't count as open or urgent
      makeTask({
        priority: "low",
        done: false,
        createdAt: Date.now() - STALE_THRESHOLD_MS - 1000,
      }), // stale
      makeTask({ priority: "normal", done: false }),
    ];
    const stats = computeBacklogStats(tasks);
    expect(stats.open).toBe(3);
    expect(stats.urgent).toBe(1);
    expect(stats.stale).toBe(1);
  });

  test("oldestOpenAgeDays is null when there are no open tasks", () => {
    const tasks = [makeTask({ done: true })];
    expect(computeBacklogStats(tasks).oldestOpenAgeDays).toBeNull();
  });
});

describe("triageSort", () => {
  test("sorts open tasks before done tasks regardless of priority", () => {
    const tasks = [
      makeTask({ id: "a", priority: "urgent", done: true }),
      makeTask({ id: "b", priority: "low", done: false }),
    ];
    const sorted = triageSort(tasks);
    expect(sorted[0].id).toBe("b");
  });

  test("sorts by priority within the same done status: urgent, normal, low", () => {
    const tasks = [
      makeTask({ id: "low", priority: "low" }),
      makeTask({ id: "urgent", priority: "urgent" }),
      makeTask({ id: "normal", priority: "normal" }),
    ];
    const sorted = triageSort(tasks);
    expect(sorted.map((t) => t.id)).toEqual(["urgent", "normal", "low"]);
  });

  test("sorts oldest first within the same priority", () => {
    const older = makeTask({
      id: "older",
      priority: "normal",
      createdAt: 1000,
    });
    const newer = makeTask({
      id: "newer",
      priority: "normal",
      createdAt: 2000,
    });
    const sorted = triageSort([newer, older]);
    expect(sorted.map((t) => t.id)).toEqual(["older", "newer"]);
  });
});

describe("applyFilter", () => {
  const tasks = [
    makeTask({ id: "urgent-open", priority: "urgent", done: false }),
    makeTask({ id: "urgent-done", priority: "urgent", done: true }),
    makeTask({
      id: "stale",
      priority: "low",
      done: false,
      createdAt: Date.now() - STALE_THRESHOLD_MS - 1000,
    }),
  ];

  test('"urgent" filter excludes done tasks even if urgent', () => {
    const result = applyFilter(tasks, "urgent");
    expect(result.map((t) => t.id)).toEqual(["urgent-open"]);
  });

  test('"stale" filter returns only stale tasks', () => {
    const result = applyFilter(tasks, "stale");
    expect(result.map((t) => t.id)).toEqual(["stale"]);
  });

  test('"all" filter returns everything unchanged', () => {
    expect(applyFilter(tasks, "all")).toHaveLength(3);
  });
});
