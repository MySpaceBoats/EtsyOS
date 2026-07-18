// Event Bus — every state change in EtsyOS is announced here. In-process
// subscribers get events synchronously; every event is also appended to an
// NDJSON log under Core/state/events/ so the Web dashboard (which reads the
// repo through the GitHub Contents API) can replay activity without any
// direct connection to the engine.

import { appendFile, mkdir, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

export interface EtsyEvent {
  at: string; // ISO timestamp
  type: string; // e.g. "workflow.started", "step.completed", "product.updated"
  workflowId?: string;
  productId?: string;
  step?: string;
  data?: Record<string, unknown>;
}

export type EventListener = (event: EtsyEvent) => void;

export class EventBus {
  private listeners = new Map<string, Set<EventListener>>();
  private eventsDir: string;

  constructor(eventsDir: string) {
    this.eventsDir = eventsDir;
  }

  // "*" subscribes to everything; otherwise exact type match.
  on(type: string, listener: EventListener): () => void {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener);
    this.listeners.set(type, set);
    return () => set.delete(listener);
  }

  async emit(event: Omit<EtsyEvent, "at"> & { at?: string }): Promise<EtsyEvent> {
    const full: EtsyEvent = { at: event.at ?? new Date().toISOString(), ...event };
    for (const listener of this.listeners.get(full.type) ?? []) listener(full);
    for (const listener of this.listeners.get("*") ?? []) listener(full);
    await mkdir(this.eventsDir, { recursive: true });
    const file = join(this.eventsDir, `${full.at.slice(0, 10)}.ndjson`);
    await appendFile(file, JSON.stringify(full) + "\n", "utf8");
    return full;
  }

  // Most recent events first, across day files.
  async recent(limit = 100): Promise<EtsyEvent[]> {
    let files: string[];
    try {
      files = (await readdir(this.eventsDir)).filter((f) => f.endsWith(".ndjson")).sort().reverse();
    } catch {
      return [];
    }
    const out: EtsyEvent[] = [];
    for (const f of files) {
      const lines = (await readFile(join(this.eventsDir, f), "utf8")).trim().split("\n");
      for (let i = lines.length - 1; i >= 0 && out.length < limit; i--) {
        if (lines[i]) out.push(JSON.parse(lines[i]) as EtsyEvent);
      }
      if (out.length >= limit) break;
    }
    return out;
  }
}
